"use client";

import { useCallback, useEffect, useState } from "react";
import Cookies from "js-cookie";
import { ChevronLeft, ChevronRight, Eye, Trash2 } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/Table";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { EmptyHistory } from "@/components/history/EmptyHistory";
import { DetectionDetailDialog } from "@/components/history/DetectionDetailDialog";
import { deleteDetectionById, getDetectionHistory, ApiRequestError } from "@/lib/api";
import { AUTH_COOKIE_NAME } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/useToast";
import type { DetectionResult } from "@/types";

const PAGE_SIZE = 10;

const riskTone: Record<DetectionResult["riskLevel"], "success" | "warning" | "danger"> = {
  Low: "success",
  Medium: "warning",
  High: "danger",
};

export default function HistoryPage() {
  const [items, setItems] = useState<DetectionResult[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewing, setViewing] = useState<DetectionResult | null>(null);
  const [pendingDelete, setPendingDelete] = useState<DetectionResult | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { toast } = useToast();

  const load = useCallback(async (nextOffset: number) => {
    const token = Cookies.get(AUTH_COOKIE_NAME);
    if (!token) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await getDetectionHistory(token, PAGE_SIZE, nextOffset);
      setItems(response.items);
      setTotal(response.total);
      setOffset(nextOffset);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to load scan history.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(0);
  }, [load]);

  async function confirmDelete() {
    if (!pendingDelete) return;
    const token = Cookies.get(AUTH_COOKIE_NAME);
    if (!token) return;

    setIsDeleting(true);
    try {
      await deleteDetectionById(token, pendingDelete.id);
      toast({ title: "Scan deleted", variant: "success" });
      setPendingDelete(null);
      await load(items.length === 1 && offset > 0 ? Math.max(0, offset - PAGE_SIZE) : offset);
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : "Failed to delete this scan.";
      toast({ title: "Delete failed", description: message, variant: "error" });
    } finally {
      setIsDeleting(false);
    }
  }

  const page = Math.floor(offset / PAGE_SIZE) + 1;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Detection History</h1>
        <p className="mt-1 text-sm text-muted">
          Every video you&apos;ve analyzed, with verdicts, confidence, and timestamps.
        </p>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      )}

      {!isLoading && error && (
        <Card className="border-danger/30 text-center">
          <p className="text-sm text-danger">{error}</p>
          <Button className="mt-4" variant="secondary" onClick={() => load(offset)}>
            Try Again
          </Button>
        </Card>
      )}

      {!isLoading && !error && items.length === 0 && <EmptyHistory />}

      {!isLoading && !error && items.length > 0 && (
        <>
          <Card className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File</TableHead>
                  <TableHead>Verdict</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead>Frames</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="max-w-[180px] truncate font-medium" title={item.filename}>
                      {item.filename}
                    </TableCell>
                    <TableCell>
                      <StatusBadge tone={item.prediction === "REAL" ? "success" : "danger"} dot={false}>
                        {item.prediction}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="font-mono">{item.confidence.toFixed(1)}%</TableCell>
                    <TableCell>
                      <StatusBadge tone={riskTone[item.riskLevel]}>{item.riskLevel}</StatusBadge>
                    </TableCell>
                    <TableCell className="text-muted">{item.framesProcessed}</TableCell>
                    <TableCell className="whitespace-nowrap text-muted">{formatDate(item.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1.5">
                        <Button variant="ghost" size="icon" onClick={() => setViewing(item)} aria-label="View details">
                          <Eye className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setPendingDelete(item)}
                          aria-label="Delete scan"
                          className="hover:text-danger"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
            <span>
              Showing {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} of {total}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={offset === 0}
                onClick={() => load(Math.max(0, offset - PAGE_SIZE))}
              >
                <ChevronLeft className="size-4" />
                Prev
              </Button>
              <span className="font-mono text-xs text-muted-foreground">
                {page} / {pageCount}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={offset + PAGE_SIZE >= total}
                onClick={() => load(offset + PAGE_SIZE)}
              >
                Next
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </>
      )}

      <DetectionDetailDialog result={viewing} onClose={() => setViewing(null)} />

      <Dialog
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        title="Delete this scan?"
        description={pendingDelete ? `This will permanently remove "${pendingDelete.filename}" from your history.` : undefined}
      >
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setPendingDelete(null)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={confirmDelete} isLoading={isDeleting}>
            Delete
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
