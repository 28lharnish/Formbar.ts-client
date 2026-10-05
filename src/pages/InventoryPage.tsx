import { deleteInventoryItem, getUserInventory } from "@/api/inventoryApi"
import FormbarHeader from "@/components/FormbarHeader";
import { useUserData } from "@/main";
import { useEffect, useState, } from "react";
import { useParams } from "react-router-dom";
import type { InventoryItem } from "@/types";
import { Row, Flex, Typography, Spin } from "antd";
const { Title } = Typography;
import InventoryItemElement from "@/components/InventoryItemElement";
import ProfileViewingCard from "@/components/ProfileViewingCard";
import Log from "@utils/debugLogger";

export default function InventoryPage() {
	const { userData } = useUserData();
	const { id } = useParams<{ id?: string }>();

	const [isLoading, setIsLoading] = useState(true);
	const [inventory, setInventory] = useState<InventoryItem[]>([]);
	const [targetId, setTargetId] = useState<string>('')

	useEffect(() => {
		if (!userData) return;
		const targetUserId = id ? id : String(userData.id);
		setTargetId(targetUserId);

		getUserInventory(targetUserId).then(({ data }) => {
			setInventory(data);
		}).catch((error) => Log({ message: "Error loading inventory", data: error, level: "error" }))
		.finally(() => {
			setIsLoading(false);
		});
	}, [userData]);

	function deleteItem(itemId: number, quantity: number) {
		if(!userData) return;

		deleteInventoryItem(targetId, itemId, quantity).then((response: any) => {
			if (response?.error || response?.success === false || response?.ok === false) {
				throw new Error(response?.error?.message || response?.message || "Failed to delete inventory item.");
			}
			updateInventory();
		}).catch((error) => Log({ message: "Error deleting inventory item", data: error, level: "error" }));
	}


	function updateInventory() {
		setIsLoading(true);

		getUserInventory(targetId).then(({ data }) => {
			setInventory(data);
		}).catch((error) => Log({ message: "Error refreshing inventory", data: error, level: "error" }))
		.finally(() => {
			setIsLoading(false);
		});
	}

	return (
		<>
			<Flex vertical style={{ height: "100vh" }}>
				<FormbarHeader />

				<Title style={{ textAlign: "center", margin: "20px" }}>
					Inventory
				</Title>

				<ProfileViewingCard userId={targetId} />

				{isLoading ? (
					<Flex justify="center" style={{ marginTop: "20px" }}>
						<Spin />
					</Flex>
				) : (
					<Row gutter={[12, 12]} justify="center">
					{
						inventory.length > 0 ? inventory.map((e) => {
							return <InventoryItemElement item={e} isMe={userData ? targetId == String(userData.id) : false} deleteFunction={deleteItem}/>
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
