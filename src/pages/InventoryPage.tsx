import { getUserInventory } from "@/api/inventoryApi"
import FormbarHeader from "@/components/FormbarHeader";
import { useUserData } from "@/main";
import { useEffect, useState, } from "react";
import { useParams } from "react-router-dom";
import type { InventoryItem } from "@/types";
import { Col, Row, Flex, Typography, Spin } from "antd";
const { Title } = Typography;
import InventoryItemElement from "@/components/InventoryItemElement";

export default function InventoryPage() {
	const { userData } = useUserData();
	const { id } = useParams<{ id?: string }>();

	const [isLoading, setIsLoading] = useState(true);
	const [inventory, setInventory] = useState<InventoryItem[]>([]);

	useEffect(() => {
		if (!userData) return;
		const targetUserId = id ? id : String(userData.id);

		getUserInventory(targetUserId).then(({ data }) => {
			setInventory(data);
		})
		.finally(() => {
			setIsLoading(false);
		});
	}, [userData]);
	
	
	return (
		<>
			<Flex vertical style={{ height: "100vh" }}>
				<FormbarHeader />

				<Title style={{ textAlign: "center", margin: "20px" }}>
					Inventory
				</Title>

				{isLoading ? (
					<Flex justify="center" style={{ marginTop: "20px" }}>
						<Spin />
					</Flex>
				) : (
					<Row gutter={[12, 12]} justify="center">
					{
						inventory.length > 0 ? inventory.map((e) => {
							return <InventoryItemElement item={e}/>
						}) : (
							<p>You have no items.</p>
						)
					}
					</Row>
				)}
			</Flex>
		</>
	)
}