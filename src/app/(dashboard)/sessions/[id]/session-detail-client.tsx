"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, DollarSign, Check, X, TrendingUp, TrendingDown, CheckCircle2, RotateCcw, Pencil } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface BuyIn {
  id: number;
  amount: string;
  requestStatus: string;
  requestedAt: string;
  approvedAt: string | null;
  approvedBy: number | null;
  rejectionReason: string | null;
  player: {
    id: number;
    username: string;
    fullName: string;
  };
  approver: {
    fullName: string;
  } | null;
}

interface SessionResult {
  id: number;
  playerId: number;
  totalBuyIn: string;
  finalAmount: string;
  profitLoss?: number;
  cashOutStatus: string;
  approvedById: number | null;
  approvedAt: string | null;
  rejectionNote: string | null;
  player?: {
    id: number;
    username: string;
    fullName: string;
  };
  approver?: {
    fullName: string;
  } | null;
}

interface Session {
  id: number;
  sessionName: string;
  sessionDate: string;
  startTime: string;
  endTime: string | null;
  status: string;
  notes: string | null;
  creator: {
    fullName: string;
  };
}

interface SessionDetailClientProps {
  sessionId: string;
  isAdmin: boolean;
  userId: string;
}

export function SessionDetailClient({ sessionId, isAdmin, userId }: SessionDetailClientProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [buyIns, setBuyIns] = useState<BuyIn[]>([]);
  const [cashOutRequests, setCashOutRequests] = useState<SessionResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [buyInDialogOpen, setBuyInDialogOpen] = useState(false);
  const [cashOutDialogOpen, setCashOutDialogOpen] = useState(false);
  const [editBuyInDialogOpen, setEditBuyInDialogOpen] = useState(false);
  const [editCashOutDialogOpen, setEditCashOutDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [buyInAmount, setBuyInAmount] = useState("");
  const [cashOutAmount, setCashOutAmount] = useState("");
  const [editingBuyIn, setEditingBuyIn] = useState<BuyIn | null>(null);
  const [editingCashOut, setEditingCashOut] = useState<SessionResult | null>(null);
  const [editBuyInAmount, setEditBuyInAmount] = useState("");
  const [editCashOutAmount, setEditCashOutAmount] = useState("");
  const [myResult, setMyResult] = useState<SessionResult | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchSessionData();
    fetchBuyIns();
    fetchMyResult();
    if (isAdmin) {
      fetchCashOutRequests();
    }
  }, [sessionId]);

  const fetchSessionData = async () => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        setSession(data);
      }
    } catch (error) {
      console.error("Error fetching session:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBuyIns = async () => {
    try {
      const response = await fetch(`/api/buy-ins?sessionId=${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        setBuyIns(data);
      }
    } catch (error) {
      console.error("Error fetching buy-ins:", error);
    }
  };

  const fetchMyResult = async () => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/cash-out`);
      if (response.ok) {
        const data = await response.json();
        setMyResult(data);
      }
    } catch (error) {
      // No result yet, that's okay
    }
  };

  const fetchCashOutRequests = async () => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/cash-outs`);
      if (response.ok) {
        const data = await response.json();
        setCashOutRequests(data);
      }
    } catch (error) {
      console.error("Error fetching cash-out requests:", error);
    }
  };

  const handleRequestBuyIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch("/api/buy-ins", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: parseInt(sessionId),
          amount: parseFloat(buyInAmount),
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Buy-in request submitted",
        });
        setBuyInDialogOpen(false);
        setBuyInAmount("");
        fetchBuyIns();
      } else {
        const error = await response.json();
        toast({
          variant: "destructive",
          title: "Error",
          description: error.error || "Failed to request buy-in",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to request buy-in",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCashOut = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch(`/api/sessions/${sessionId}/cash-out`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          finalAmount: parseFloat(cashOutAmount),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Success",
          description: `Cashed out ₹${data.finalAmount}. ${
            data.profitLoss >= 0
              ? `Profit: ₹${data.profitLoss}`
              : `Loss: ₹${Math.abs(data.profitLoss)}`
          }`,
        });
        setCashOutDialogOpen(false);
        setCashOutAmount("");
        fetchMyResult();
      } else {
        const error = await response.json();
        toast({
          variant: "destructive",
          title: "Error",
          description: error.error || "Failed to cash out",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to cash out",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveBuyIn = async (buyInId: number, amount?: number) => {
    try {
      const response = await fetch(`/api/buy-ins/${buyInId}/approve`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Buy-in approved",
        });
        fetchBuyIns();
        if (isAdmin) {
          fetchCashOutRequests();
        }
      } else {
        const error = await response.json();
        toast({
          variant: "destructive",
          title: "Error",
          description: error.error || "Failed to approve buy-in",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to approve buy-in",
      });
    }
  };

  const handleEditBuyIn = (buyIn: BuyIn) => {
    setEditingBuyIn(buyIn);
    setEditBuyInAmount(buyIn.amount);
    setEditBuyInDialogOpen(true);
  };

  const handleSaveEditedBuyIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBuyIn) return;

    setSubmitting(true);
    try {
      await handleApproveBuyIn(editingBuyIn.id, parseFloat(editBuyInAmount));
      setEditBuyInDialogOpen(false);
      setEditingBuyIn(null);
      setEditBuyInAmount("");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectBuyIn = async (buyInId: number, reason?: string) => {
    try {
      const response = await fetch(`/api/buy-ins/${buyInId}/reject`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rejectionReason: reason }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Buy-in rejected",
        });
        fetchBuyIns();
      } else {
        const error = await response.json();
        toast({
          variant: "destructive",
          title: "Error",
          description: error.error || "Failed to reject buy-in",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to reject buy-in",
      });
    }
  };

  const handleApproveCashOut = async (playerId: number, finalAmount?: number) => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/cash-out/approve`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ playerId, finalAmount }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Cash-out approved",
        });
        fetchCashOutRequests();
      } else {
        const error = await response.json();
        toast({
          variant: "destructive",
          title: "Error",
          description: error.error || "Failed to approve cash-out",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to approve cash-out",
      });
    }
  };

  const handleEditCashOut = (cashOut: SessionResult) => {
    setEditingCashOut(cashOut);
    setEditCashOutAmount(cashOut.finalAmount.toString());
    setEditCashOutDialogOpen(true);
  };

  const handleSaveEditedCashOut = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCashOut) return;

    setSubmitting(true);
    try {
      await handleApproveCashOut(editingCashOut.playerId, parseFloat(editCashOutAmount));
      setEditCashOutDialogOpen(false);
      setEditingCashOut(null);
      setEditCashOutAmount("");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectCashOut = async (playerId: number, note?: string) => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/cash-out/reject`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ playerId, rejectionNote: note }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Cash-out rejected",
        });
        fetchCashOutRequests();
      } else {
        const error = await response.json();
        toast({
          variant: "destructive",
          title: "Error",
          description: error.error || "Failed to reject cash-out",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to reject cash-out",
      });
    }
  };

  const handleEndSession = async () => {
    if (!confirm("Are you sure you want to end this session? All players must have approved cash-outs and the books must balance.")) {
      return;
    }

    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "completed" }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Session ended successfully",
        });
        fetchSessionData();
      } else {
        const error = await response.json();
        toast({
          variant: "destructive",
          title: "Error",
          description: error.error || "Failed to end session",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to end session",
      });
    }
  };

  const handleReopenSession = async () => {
    if (!confirm("Are you sure you want to reopen this session? This will allow players to make changes.")) {
      return;
    }

    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "active" }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Session reopened successfully",
        });
        fetchSessionData();
      } else {
        const error = await response.json();
        toast({
          variant: "destructive",
          title: "Error",
          description: error.error || "Failed to reopen session",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to reopen session",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      approved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    };
    return (
      <Badge className={colors[status.toLowerCase() as keyof typeof colors] || colors.pending}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const myBuyIns = buyIns.filter((b) => b.player.id === parseInt(userId));
  const myApprovedBuyIns = myBuyIns.filter((b) => b.requestStatus.toLowerCase() === "approved");
  const myTotalBuyIn = myApprovedBuyIns.reduce((sum, b) => sum + parseFloat(b.amount), 0);

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!session) {
    return <div className="p-8">Session not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/sessions">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{session.sessionName}</h1>
            <p className="text-muted-foreground">
              {formatDate(session.sessionDate)} at {formatTime(session.startTime)}
            </p>
          </div>
        </div>
        {isAdmin && (
          <>
            {session.status === "active" && (
              <Button variant="outline" onClick={handleEndSession}>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                End Session
              </Button>
            )}
            {(session.status === "completed" || session.status === "cancelled") && (
              <Button variant="outline" onClick={handleReopenSession}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Reopen Session
              </Button>
            )}
          </>
        )}
      </div>

      {/* My Stats */}
      <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Buy-In</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{myTotalBuyIn.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {myApprovedBuyIns.length} approved buy-in(s)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Final Stack</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {myResult ? `₹${parseFloat(myResult.finalAmount).toFixed(2)}` : "-"}
              </div>
              <p className="text-xs text-muted-foreground">Current chip count</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Profit/Loss</CardTitle>
            </CardHeader>
            <CardContent>
              {myResult && myResult.profitLoss !== undefined ? (
                <>
                  <div
                    className={`text-2xl font-bold flex items-center gap-1 ${
                      myResult.profitLoss >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {myResult.profitLoss >= 0 ? (
                      <TrendingUp className="h-5 w-5" />
                    ) : (
                      <TrendingDown className="h-5 w-5" />
                    )}
                    ₹{Math.abs(myResult.profitLoss).toFixed(2)}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-muted-foreground">
                      {myResult.profitLoss >= 0 ? "Profit" : "Loss"}
                    </p>
                    {getStatusBadge(myResult.cashOutStatus)}
                  </div>
                  {myResult.rejectionNote && (
                    <p className="text-xs text-red-600 mt-1">
                      {myResult.rejectionNote}
                    </p>
                  )}
                </>
              ) : (
                <div className="text-2xl font-bold">-</div>
              )}
            </CardContent>
          </Card>
        </div>

      {/* Actions */}
      {session.status === "active" && (
        <div className="flex gap-2">
          <Dialog open={buyInDialogOpen} onOpenChange={setBuyInDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Request Buy-In
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Request Buy-In</DialogTitle>
                <DialogDescription>
                  Enter the amount you want to buy in for
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleRequestBuyIn}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="amount">Amount (₹) *</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="1000.00"
                      value={buyInAmount}
                      onChange={(e) => setBuyInAmount(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setBuyInDialogOpen(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Submitting..." : "Submit Request"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={cashOutDialogOpen} onOpenChange={setCashOutDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <DollarSign className="mr-2 h-4 w-4" />
                Cash Out
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cash Out</DialogTitle>
                <DialogDescription>
                  Enter your final chip count to cash out
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCashOut}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="finalAmount">Final Stack (₹) *</Label>
                    <Input
                      id="finalAmount"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="1500.00"
                      value={cashOutAmount}
                      onChange={(e) => setCashOutAmount(e.target.value)}
                      required
                    />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Your total buy-in: ₹{myTotalBuyIn.toFixed(2)}
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCashOutDialogOpen(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Processing..." : "Cash Out"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Edit Buy-In Dialog (Admin Only) */}
      <Dialog open={editBuyInDialogOpen} onOpenChange={setEditBuyInDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Buy-In Amount</DialogTitle>
            <DialogDescription>
              Adjust the buy-in amount for {editingBuyIn?.player.fullName}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveEditedBuyIn}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="editBuyInAmount">Amount (₹) *</Label>
                <Input
                  id="editBuyInAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="1000.00"
                  value={editBuyInAmount}
                  onChange={(e) => setEditBuyInAmount(e.target.value)}
                  required
                />
              </div>
              <div className="text-sm text-muted-foreground">
                Original request: ₹{editingBuyIn ? parseFloat(editingBuyIn.amount).toFixed(2) : "0.00"}
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditBuyInDialogOpen(false);
                  setEditingBuyIn(null);
                }}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Approving..." : "Approve with New Amount"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Cash-Out Dialog (Admin Only) */}
      <Dialog open={editCashOutDialogOpen} onOpenChange={setEditCashOutDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Cash-Out Amount</DialogTitle>
            <DialogDescription>
              Adjust the final stack amount for {editingCashOut?.player?.fullName}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveEditedCashOut}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="editCashOutAmount">Final Stack (₹) *</Label>
                <Input
                  id="editCashOutAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="1500.00"
                  value={editCashOutAmount}
                  onChange={(e) => setEditCashOutAmount(e.target.value)}
                  required
                />
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Original amount: ₹{editingCashOut ? parseFloat(editingCashOut.finalAmount.toString()).toFixed(2) : "0.00"}</p>
                <p>Total buy-in: ₹{editingCashOut ? parseFloat(editingCashOut.totalBuyIn.toString()).toFixed(2) : "0.00"}</p>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditCashOutDialogOpen(false);
                  setEditingCashOut(null);
                }}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Approving..." : "Approve with New Amount"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Buy-Ins List */}
      <Card>
        <CardHeader>
          <CardTitle>Buy-Ins</CardTitle>
          <CardDescription>
            {isAdmin ? "All buy-in requests for this session" : "Your buy-in history"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(isAdmin ? buyIns : myBuyIns).length === 0 ? (
            <p className="text-sm text-muted-foreground">No buy-ins yet</p>
          ) : (
            <div className="space-y-4">
              {(isAdmin ? buyIns : myBuyIns).map((buyIn) => (
                <div
                  key={buyIn.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <div className="font-semibold">
                      {buyIn.player.fullName} (@{buyIn.player.username})
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Amount: ₹{parseFloat(buyIn.amount).toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Requested: {formatDate(buyIn.requestedAt)} at{" "}
                      {formatTime(buyIn.requestedAt)}
                    </div>
                    {buyIn.approvedAt && (
                      <div className="text-xs text-muted-foreground">
                        Approved by: {buyIn.approver?.fullName}
                      </div>
                    )}
                    {buyIn.rejectionReason && (
                      <div className="text-xs text-red-600">
                        Reason: {buyIn.rejectionReason}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(buyIn.requestStatus)}
                    {isAdmin && buyIn.requestStatus.toLowerCase() === "pending" && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditBuyIn(buyIn)}
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          Edit & Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleApproveBuyIn(buyIn.id)}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRejectBuyIn(buyIn.id)}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cash-Out Requests (Admin Only) */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Cash-Out Requests</CardTitle>
            <CardDescription>
              All cash-out requests for this session
            </CardDescription>
          </CardHeader>
          <CardContent>
            {cashOutRequests.length === 0 ? (
              <p className="text-sm text-muted-foreground">No cash-out requests yet</p>
            ) : (
              <div className="space-y-4">
                {cashOutRequests.map((result) => (
                  <div
                    key={result.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <div className="font-semibold">
                        {result.player?.fullName} (@{result.player?.username})
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Total Buy-In: ₹{parseFloat(result.totalBuyIn.toString()).toFixed(2)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Final Stack: ₹{parseFloat(result.finalAmount.toString()).toFixed(2)}
                      </div>
                      <div
                        className={`text-sm font-semibold ${
                          result.profitLoss && result.profitLoss >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {result.profitLoss && result.profitLoss >= 0 ? "Profit" : "Loss"}:{" "}
                        ₹{result.profitLoss ? Math.abs(result.profitLoss).toFixed(2) : "0.00"}
                      </div>
                      {result.approvedAt && result.approver && (
                        <div className="text-xs text-muted-foreground">
                          Approved by: {result.approver.fullName}
                        </div>
                      )}
                      {result.rejectionNote && (
                        <div className="text-xs text-red-600">
                          Reason: {result.rejectionNote}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(result.cashOutStatus)}
                      {result.cashOutStatus.toLowerCase() === "pending" && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditCashOut(result)}
                          >
                            <Pencil className="h-4 w-4 mr-1" />
                            Edit & Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleApproveCashOut(result.playerId)}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRejectCashOut(result.playerId)}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
