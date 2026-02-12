'use client';

import { useEffect, useState } from 'react';
import CustomerDataTable from "@/components/customers/data-table";
import { Customer } from "@/lib/types";
import { customersApi } from "@/lib/api";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        const response = await customersApi.getAll();
        if (response.success && response.data) {
          setCustomers(response.data.customers);
        }
      } catch (error) {
        console.error("Failed to load customers", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-primary mb-4">Customers</h1>
      {loading ? (
        <div className="p-4 text-center">Loading customers...</div>
      ) : (
        <CustomerDataTable data={customers} />
      )}
    </div>
  );
}