import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PlayersPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Players</h1>
          <p className="text-muted-foreground">Manage player accounts</p>
        </div>
        <Button>Add New Player</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Players</CardTitle>
          <CardDescription>List of registered players</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No players yet.</p>
        </CardContent>
      </Card>
    </div>
  );
}
