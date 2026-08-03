const PRINTER_STORAGE_KEY = 'glitch_slay_printer_id';

export interface PrinterInfo {
  id: string;
  name: string;
}

export type OrderForPrint = {
  id: string;
  date: string;
  items: Array<{ name: string; quantity: number; variant: { name: string; price: number } }>;
  subtotal: number;
  tax: number;
  shippingFee: number;
  total: number;
  shippingAddress: { fullName: string; email: string };
  paymentMethod: string;
  deliveryMethod: string;
  appName?: string;
};

function getPrinterInfo(): PrinterInfo | null {
  try {
    const stored = localStorage.getItem(PRINTER_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function savePrinterInfo(info: PrinterInfo) {
  localStorage.setItem(PRINTER_STORAGE_KEY, JSON.stringify(info));
}

export function clearPrinterInfo() {
  localStorage.removeItem(PRINTER_STORAGE_KEY);
}

export function isWebBluetoothAvailable(): boolean {
  return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
}

export function isPrinterPaired(): boolean {
  return getPrinterInfo() !== null;
}

export async function pairPrinter(): Promise<PrinterInfo> {
  if (!isWebBluetoothAvailable()) {
    throw new Error('Web Bluetooth is not available on this device or browser. Use Chrome on desktop or Android.');
  }

  const device = await navigator.bluetooth.requestDevice({
    acceptAllDevices: true,
    optionalServices: [
      '00001101-0000-1000-8000-00805f9b34fb',
      '6e400001-b5a3-f393-e0a9-e50e24dcca9e',
    ],
  });

  if (!device || !device.name) {
    throw new Error('No printer selected or device has no name.');
  }

  const info: PrinterInfo = { id: device.id, name: device.name };
  savePrinterInfo(info);
  return info;
}

async function findDevice(): Promise<BluetoothDevice | null> {
  const printerInfo = getPrinterInfo();
  if (!printerInfo) return null;

  const devices = await navigator.bluetooth.getDevices();
  return devices.find((d: BluetoothDevice) => d.id === printerInfo.id || d.name === printerInfo.name) || null;
}

function encodeText(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

function concat(...arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((s, a) => s + a.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

export function generateReceiptData(order: OrderForPrint): Uint8Array {
  const dateStr = new Date(order.date).toLocaleString();
  const storeName = order.appName || 'Glitch & Slay';
  const line = '='.repeat(40) + '\n';
  const thin = '-'.repeat(40) + '\n';

  const header = [
    encodeText('\x1B\x40'),
    encodeText('\x1B\x61\x01'),
    encodeText('\x1B\x45\x01'),
    encodeText('\x1D\x21\x11'),
    encodeText(storeName + '\n'),
    encodeText('\x1D\x21\x00'),
    encodeText('\x1B\x45\x00'),
    encodeText('Fashion that speaks before you do.\n'),
    encodeText('\n'),
    encodeText(thin),
    encodeText('\x1B\x45\x01'),
    encodeText(`INVOICE #${order.id}\n`),
    encodeText('\x1B\x45\x00'),
    encodeText(`Date: ${dateStr}\n`),
    encodeText(line),
    encodeText('\x1B\x61\x00'),
    encodeText(`Customer: ${order.shippingAddress.fullName}\n`),
    encodeText(`Email: ${order.shippingAddress.email}\n`),
    encodeText(`Payment: ${order.paymentMethod}\n`),
    encodeText(`Delivery: ${order.deliveryMethod}\n`),
    encodeText('\n'),
    encodeText(line),
    encodeText('\x1B\x45\x01'),
    encodeText('ITEM                    QTY   AMOUNT\n'),
    encodeText('\x1B\x45\x00'),
    encodeText(thin),
  ];

  const items = order.items.map(item => {
    const name = item.name.length > 22 ? item.name.substring(0, 21) + '.' : item.name;
    const qty = String(item.quantity).padStart(5);
    const amt = `GHS ${(item.variant.price * item.quantity).toFixed(2)}`.padStart(10);
    const lines: Uint8Array[] = [encodeText(`${name.padEnd(24)}${qty}${amt}\n`)];
    if (item.variant.name) {
      lines.push(encodeText(`  ${item.variant.name}\n`));
    }
    return concat(...lines);
  });

  const footer = [
    encodeText(thin),
    encodeText('\x1B\x61\x02'),
    encodeText(`Subtotal:           GHS ${order.subtotal.toFixed(2)}\n`),
    encodeText(`Tax:                GHS ${order.tax.toFixed(2)}\n`),
    encodeText(`Shipping:           GHS ${order.shippingFee.toFixed(2)}\n`),
    encodeText(line),
    encodeText('\x1B\x45\x01'),
    encodeText('\x1D\x21\x11'),
    encodeText(`TOTAL: GHS ${order.total.toFixed(2)}\n`),
    encodeText('\x1D\x21\x00'),
    encodeText('\x1B\x45\x00'),
    encodeText('\n'),
    encodeText('\x1B\x61\x01'),
    encodeText('Thank you for your purchase!\n'),
    encodeText('\x1B\x64\x04'),
    encodeText('\x1D\x56\x00'),
  ];

  return concat(...header, ...items, ...footer);
}

export async function printInvoice(order: OrderForPrint): Promise<void> {
  if (!isWebBluetoothAvailable()) {
    throw new Error('Web Bluetooth is not available.');
  }

  const device = await findDevice();
  if (!device) {
    throw new Error('no-printer-paired');
  }

  if (!device.gatt) {
    throw new Error('Printer unavailable. Try reconnecting.');
  }

  const server = await device.gatt.connect();

  const serviceUUIDs = [
    '00001101-0000-1000-8000-00805f9b34fb',
    '6e400001-b5a3-f393-e0a9-e50e24dcca9e',
  ];

  let service: BluetoothRemoteGATTService | null = null;
  for (const uuid of serviceUUIDs) {
    try {
      service = await server.getPrimaryService(uuid);
      if (service) break;
    } catch {
      continue;
    }
  }

  if (!service) {
    server.disconnect();
    throw new Error('Could not find printer service. Try re-pairing the printer.');
  }

  const characteristics = await service.getCharacteristics();
  let writeChar = characteristics.find(
    (c: BluetoothRemoteGATTCharacteristic) => c.properties.write || c.properties.writeWithoutResponse
  );

  if (!writeChar) {
    for (const c of characteristics) {
      try {
        const uuid = c.uuid;
        writeChar = await service.getCharacteristic(uuid);
        if (writeChar.properties.write || writeChar.properties.writeWithoutResponse) break;
      } catch {
        continue;
      }
    }
  }

  if (!writeChar) {
    server.disconnect();
    throw new Error('Could not find writable characteristic on printer.');
  }

  const data = generateReceiptData(order);
  const chunkSize = 512;

  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    await writeChar.writeValue(chunk);
  }

  try {
    server.disconnect();
  } catch {
    // ignore disconnect errors
  }
}
