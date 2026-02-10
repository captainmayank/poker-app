import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SessionsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Sessions</h1>
        <p className="text-muted-foreground">View and manage poker sessions</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Sessions</CardTitle>
          <CardDescription>List of all poker sessions</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No sessions yet. Check back later!</p>
        </CardContent>
      </Card>
    </div>
  );
}
