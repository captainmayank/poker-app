import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettlementsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Settlements</h1>
        <p className="text-muted-foreground">Manage your poker settlements</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Settlement History</CardTitle>
          <CardDescription>Track your payments and receipts</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No settlements yet.</p>
        </CardContent>
      </Card>
    </div>
  );
}
