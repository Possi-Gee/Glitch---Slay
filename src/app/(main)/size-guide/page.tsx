'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const CLOTHING_SIZES = [
  { size: 'XXS', bust: '30"', waist: '23"', hip: '33"', uk: '4', eu: '32' },
  { size: 'XS', bust: '32"', waist: '25"', hip: '35"', uk: '6', eu: '34' },
  { size: 'S', bust: '34"', waist: '27"', hip: '37"', uk: '8', eu: '36' },
  { size: 'M', bust: '36"', waist: '29"', hip: '39"', uk: '10', eu: '38' },
  { size: 'L', bust: '38"', waist: '31"', hip: '41"', uk: '12', eu: '40' },
  { size: 'XL', bust: '41"', waist: '34"', hip: '44"', uk: '14', eu: '42' },
  { size: 'XXL', bust: '44"', waist: '37"', hip: '47"', uk: '16', eu: '44' },
  { size: '3XL', bust: '47"', waist: '40"', hip: '50"', uk: '18', eu: '46' },
];

const FOOTWEAR_SIZES = [
  { uk: '3', eu: '36', us: '5', cm: '22' },
  { uk: '4', eu: '37', us: '6', cm: '23' },
  { uk: '5', eu: '38', us: '7', cm: '24' },
  { uk: '6', eu: '39', us: '8', cm: '25' },
  { uk: '7', eu: '40', us: '9', cm: '26' },
  { uk: '8', eu: '41', us: '10', cm: '27' },
  { uk: '9', eu: '42', us: '11', cm: '28' },
  { uk: '10', eu: '43', us: '12', cm: '29' },
  { uk: '11', eu: '44', us: '13', cm: '30' },
];

export default function SizeGuidePage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">Size Guide</h1>
      <p className="text-muted-foreground mb-8">
        Find your perfect fit with our detailed size charts.
      </p>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Women&apos;s Clothing</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-2 font-semibold">Size</th>
                <th className="text-left py-3 px-2 font-semibold">Bust</th>
                <th className="text-left py-3 px-2 font-semibold">Waist</th>
                <th className="text-left py-3 px-2 font-semibold">Hip</th>
                <th className="text-left py-3 px-2 font-semibold">UK</th>
                <th className="text-left py-3 px-2 font-semibold">EU</th>
              </tr>
            </thead>
            <tbody>
              {CLOTHING_SIZES.map((row) => (
                <tr key={row.size} className="border-b last:border-0 hover:bg-muted/50">
                  <td className="py-3 px-2 font-medium">{row.size}</td>
                  <td className="py-3 px-2 text-muted-foreground">{row.bust}</td>
                  <td className="py-3 px-2 text-muted-foreground">{row.waist}</td>
                  <td className="py-3 px-2 text-muted-foreground">{row.hip}</td>
                  <td className="py-3 px-2 text-muted-foreground">{row.uk}</td>
                  <td className="py-3 px-2 text-muted-foreground">{row.eu}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Footwear</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-2 font-semibold">UK</th>
                <th className="text-left py-3 px-2 font-semibold">EU</th>
                <th className="text-left py-3 px-2 font-semibold">US</th>
                <th className="text-left py-3 px-2 font-semibold">Foot Length (cm)</th>
              </tr>
            </thead>
            <tbody>
              {FOOTWEAR_SIZES.map((row) => (
                <tr key={row.uk} className="border-b last:border-0 hover:bg-muted/50">
                  <td className="py-3 px-2 font-medium">{row.uk}</td>
                  <td className="py-3 px-2 text-muted-foreground">{row.eu}</td>
                  <td className="py-3 px-2 text-muted-foreground">{row.us}</td>
                  <td className="py-3 px-2 text-muted-foreground">{row.cm} cm</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Measuring Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p><strong>Bust:</strong> Measure around the fullest part of your chest, keeping the tape parallel to the floor.</p>
          <p><strong>Waist:</strong> Measure around the narrowest part of your natural waist, typically just above the belly button.</p>
          <p><strong>Hip:</strong> Measure around the fullest part of your hips, about 20cm below your waist.</p>
          <p><strong>Foot Length:</strong> Stand on a piece of paper, mark the longest point of your foot, and measure the distance.</p>
          <p className="mt-4 text-xs">If you&apos;re between sizes, we recommend sizing up for a more comfortable fit.</p>
        </CardContent>
      </Card>
    </div>
  );
}
