import React from "react";
import QRCode from "react-qr-code";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface QRCodeCardProps {
  value: string;
  title?: string;
  description?: string;
}

export const QRCodeCard: React.FC<QRCodeCardProps> = ({ value, title = "Quick Access", description }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center gap-6">
        <div className="bg-background p-4 rounded-md border">
          <QRCode value={value} size={120} />
        </div>
        <div className="text-sm text-muted-foreground break-all">
          {description ? <p className="mb-2">{description}</p> : null}
          <a href={value} className="text-primary underline break-all">{value}</a>
        </div>
      </CardContent>
    </Card>
  );
};
