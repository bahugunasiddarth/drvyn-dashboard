"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Booking, BookingStatus } from "@/lib/types";
import { bookingsColumns } from "./columns";
import { bookingsApi } from "@/lib/api"; //

interface DataTableProps {
  data: Booking[];
}

export default function BookingsDataTable({ data: initialData }: DataTableProps) {
  const [data, setData] = React.useState<Booking[]>(initialData || []);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<BookingStatus | "all">("all");
  const [isLoading, setIsLoading] = React.useState(false); // Default to false since we pass initialData

  const columns = bookingsColumns;

  // Fetch data from backend API
  React.useEffect(() => {
    // Skip initial fetch if we have data, unless filter changes
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // Use the centralized API client
        const response = await bookingsApi.getAll(
          statusFilter !== "all" ? statusFilter : undefined
        );
        
        if (response.success && response.data) {
           setData(response.data.bookings);
        } else {
           console.error("Failed to fetch bookings:", response.error);
        }
      } catch (error) {
        console.error("Error fetching bookings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [statusFilter]);

  const filteredData = React.useMemo(() => {
    let filtered = data;

    if (globalFilter) {
      filtered = filtered.filter(
        (item) =>
          item.brand?.toLowerCase().includes(globalFilter.toLowerCase()) ||
          item.model?.toLowerCase().includes(globalFilter.toLowerCase()) ||
          item.year?.toLowerCase().includes(globalFilter.toLowerCase()) ||
          item.phone?.includes(globalFilter)
      );
    }

    return filtered;
  }, [data, globalFilter]);

  const updateData = React.useCallback(
    async (rowIndex: number, columnId: string, value: any) => {
      const booking = data[rowIndex];

      if (columnId === "status" && booking._id) {
        // Optimistic Update: Update UI immediately
        setData((old) =>
          old.map((row, index) =>
            index === rowIndex ? { ...row, status: value } : row
          )
        );

        try {
          // Use the centralized API client
          const response = await bookingsApi.updateStatus(booking._id, value);
          
          if (!response.success) {
             throw new Error(response.error);
          }
          
        } catch (error) {
          console.error("Error updating booking status:", error);
          // Revert the change if API call fails
          setData((old) =>
            old.map((row, index) =>
              index === rowIndex ? { ...row, status: booking.status } : row
            )
          );
        }
      }
    },
    [data]
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    meta: {
      updateData,
    },
    initialState: {
      pagination: {
        pageSize: 7,
      },
    },
  });

  const bookingStatuses: BookingStatus[] = [
    "pending",
    "confirmed",
    "completed",
    "cancelled",
    "not-interested",
    "to-follow-up",
    "cold-enq",
    "booking-confirmed",
  ];

  // Get pagination state
  const { pageIndex, pageSize } = table.getState().pagination;
  const totalRows = table.getFilteredRowModel().rows.length;
  const currentPageRows = table.getRowModel().rows.length;
  const pageCount = table.getPageCount();

  // Calculate item range
  const itemStart = pageIndex * pageSize + 1;
  const itemEnd = itemStart + currentPageRows - 1;

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="flex items-center p-4 gap-4">
        <Input
          placeholder="Search by brand, model, year, phone..."
          value={globalFilter}
          onChange={(event) => setGlobalFilter(event.target.value)}
          className="max-w-sm"
        />
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as any)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {bookingStatuses.map((status) => (
              <SelectItem key={status} value={status} className="capitalize">
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="border-t">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      className="whitespace-nowrap font-bold text-black"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
               <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between p-4 border-t">
        <div className="text-sm text-muted-foreground">
          {totalRows === 0
            ? "No results."
            : `Showing ${itemStart}–${itemEnd} of ${totalRows} booking(s). Page ${
                pageIndex + 1
              } of ${pageCount}.`}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}