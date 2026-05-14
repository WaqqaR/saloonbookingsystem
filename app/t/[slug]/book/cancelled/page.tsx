import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function BookingCancelled({ params }: { params: Promise<{ slug: string }> }) {
  await params;
  return (
    <div className="min-h-screen bg-background grid place-items-center p-6">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="mx-auto h-12 w-12 rounded-full bg-muted grid place-items-center mb-2">
            <X className="w-6 h-6 text-muted-foreground" />
          </div>
          <CardTitle className="font-display text-3xl font-light text-center">Payment cancelled</CardTitle>
          <CardDescription className="text-center leading-relaxed">
            Your booking wasn&apos;t confirmed because the payment wasn&apos;t completed. The time slot has been released.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/book"><Button className="w-full">Try again</Button></Link>
        </CardContent>
      </Card>
    </div>
  );
}
