import * as React from "react";
import { cn } from "@/utils";

function Table({ className, ...props }: React.ComponentProps<"div">) {
	return <div data-slot="table" className={cn("w-full overflow-x-auto", className)} {...props} />;
}

function TableHeader({ className, ...props }: React.ComponentProps<"div">) {
	return <div data-slot="table-header" className={cn("bg-muted/30", className)} {...props} />;
}

function TableBody({ className, ...props }: React.ComponentProps<"div">) {
	return <div data-slot="table-body" className={cn("", className)} {...props} />;
}

function TableRow({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="table-row"
			className={cn("group/data grid border-b transition-colors hover:bg-muted/50", className)}
			{...props}
		/>
	);
}

function TableHead({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="table-head"
			className={cn("px-4 py-3 text-left text-sm font-semibold text-muted-foreground", className)}
			{...props}
		/>
	);
}

function TableCell({ className, ...props }: React.ComponentProps<"div">) {
	return <div data-slot="table-cell" className={cn("px-4 py-3 text-sm", className)} {...props} />;
}

export { Table, TableBody, TableCell, TableHead, TableHeader, TableRow };
