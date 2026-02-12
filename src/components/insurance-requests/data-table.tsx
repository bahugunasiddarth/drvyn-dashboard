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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InsuranceRequest, InsuranceStatus } from "@/lib/types";
import { insuranceRequestColumns } from "./columns";
import { insuranceRequestsApi } from "@/lib/api"; // Import API

interface DataTableProps {
  data: InsuranceRequest[];
}

// Global Cache
let globalCachedData: InsuranceRequest[] | null = null;

export default function InsuranceDataTable({ data: initialData }: DataTableProps) {
  const [data, setData] = React.useState<InsuranceRequest[]>(globalCachedData || initialData || []);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<InsuranceStatus | "all">("all");
  const [isLoading, setIsLoading] = React.useState(!globalCachedData && (!initialData || initialData.length === 0));
  
  const columns = insuranceRequestColumns;

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        if (!data.length) setIsLoading(true);
        const response = await insuranceRequestsApi.getAll();
        
        if (response.success && response.data) {
          const freshData = response.data.requests;
          globalCachedData = freshData;
          setData(freshData);
        }
      } catch (error) {
        console.error('Error fetching insurance requests:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredData = React.useMemo(() => {
    let filtered = data;

    if (statusFilter !== "all") {
      filtered = filtered.filter((item: InsuranceRequest) => item.status === statusFilter);
    }

    if (globalFilter) {
      filtered = filtered.filter((item: InsuranceRequest) =>
        item.brand?.toLowerCase().includes(globalFilter.toLowerCase()) ||
        item.model?.toLowerCase().includes(globalFilter.toLowerCase()) ||
        item.year?.toLowerCase().includes(globalFilter.toLowerCase())
      );
    }
    
    return filtered;
  }, [data, globalFilter, statusFilter]);

  const updateData = React.useCallback(async (rowIndex: number, columnId: string, value: any) => {
    const request = data[rowIndex];
    
    if (columnId === 'status' && request._id) {
       // Optimistic Update
       setData((old) => {
          const newData = old.map((row, index) => 
             index === rowIndex ? { ...row, status: value } : row
          );
          globalCachedData = newData;
          return newData;
       });

       try {
          // Send to Backend
          const response = await insuranceRequestsApi.updateStatus(request._id, value);
          if (!response.success) throw new Error("Failed to update");
       } catch (error) {
          console.error("Failed to save status:", error);
          // Revert
          setData((old) => old.map((row, index) => 
             index === rowIndex ? { ...row, status: request.status } : row
          ));
       }
    }
  }, [data]);

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
        }
    }
  });

  const insuranceStatuses: InsuranceStatus[] = ["new", "contacted", "completed", "rejected", "not-interested", "to-follow-up", "cold-enq", "booking-confirmed"];
  const { pageIndex, pageSize } = table.getState().pagination;
  const totalRows = table.getFilteredRowModel().rows.length;
  const currentPageRows = table.getRowModel().rows.length;
  const pageCount = table.getPageCount();
  const itemStart = pageIndex * pageSize + 1;
  const itemEnd = itemStart + currentPageRows - 1;

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="flex items-center p-4 gap-4">
        <Input
          placeholder="Search by brand, model, year..."
          value={globalFilter}
          onChange={(event) => setGlobalFilter(event.target.value)}
          className="max-w-sm"
        />
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {insuranceStatuses.map(status => (
                <SelectItem key={status} value={status} className="capitalize">{status}</SelectItem>
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
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
               <TableRow><TableCell colSpan={columns.length} className="h-24 text-center">Loading...</TableCell></TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={columns.length} className="h-24 text-center">No results.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between p-4 border-t">
        <div className="text-sm text-muted-foreground">
          {totalRows === 0 ? "No results." : `Showing ${itemStart}–${itemEnd} of ${totalRows} requests. Page ${pageIndex + 1} of ${pageCount}.`}
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Previous</Button>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Next</Button>
        </div>
      </div>
    </div>
  );
}