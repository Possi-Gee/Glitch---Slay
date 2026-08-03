interface BluetoothDevice {
  id: string;
  name?: string;
  gatt?: BluetoothRemoteGATTServer;
}

interface BluetoothRemoteGATTServer {
  connect: () => Promise<BluetoothRemoteGATTServer>;
  disconnect: () => void;
  getPrimaryService: (uuid: string) => Promise<BluetoothRemoteGATTService>;
}

interface BluetoothRemoteGATTService {
  getCharacteristic: (uuid: string) => Promise<BluetoothRemoteGATTCharacteristic>;
  getCharacteristics: () => Promise<BluetoothRemoteGATTCharacteristic[]>;
}

interface BluetoothRemoteGATTCharacteristic {
  uuid: string;
  properties: {
    write: boolean;
    writeWithoutResponse: boolean;
  };
  writeValue: (value: BufferSource) => Promise<void>;
}

interface Navigator {
  bluetooth: {
    requestDevice: (options: {
      filters?: Array<{ services?: string[]; name?: string; namePrefix?: string }>;
      acceptAllDevices?: boolean;
      optionalServices?: string[];
    }) => Promise<BluetoothDevice>;
    getDevices: () => Promise<BluetoothDevice[]>;
  };
}
