import { useProducts, useInventoryActions } from "@/store/inventoryStore";
import { useUserInfo } from "@/store/userStore";
import { Card } from "@/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table";
import { Badge } from "@/ui/badge";
import { StockChangeDto } from "@/api/services/inventoryService";
import inventoryService from "@/api/services/inventoryService";
import { Button } from "@/ui/button";

export default function editStock() {
	return (
		<div>
			<h1>test</h1>
		</div>
	);
}
