import {
	Card,
	Tooltip,
	Flex,
	Row,
	Col,
	Statistic,
	Modal,
	Typography,
	InputNumber,
	Segmented,
} from "antd";
import {
	payoutPool,
	deletePool,
} from "@api/pogPoolsApi";
const { Text } = Typography;
import { IonIcon } from "@ionic/react";
import Log from "@utils/debugLogger";
import { useState } from "react";
import * as IonIcons from "ionicons/icons";
import type { PogPool } from "@/types";
import { currentUserHasScope } from "@/utils/scopeUtils";
import { useUserData } from "@/main";
import { useGlobalMessage } from "@/components/providers/GlobalMessageProvider";
import { messageTemplates } from "@utils/messageTemplates";

export default function PogPoolElement({
	pool,
	refreshPools,
}: {
	pool: PogPool;
	refreshPools: Function;
}) {
	const { userData } = useUserData();
	const globalMessageAPI = useGlobalMessage();
	const [modal, contextHolder] = Modal.useModal();
	
	const [payoutModalOpen, setPayoutModalOpen] = useState<boolean>(false);
	const [percentOrSet, setPercentOrSet] = useState<"Percent" | "Digipogs">("Percent");
	const [payoutPercent, setPayoutPercent] = useState<number>(100);
	const [payoutDigipogs, setPayoutDigipogs] = useState<number>(pool.amount);

	const handlePayout = (poolId: number) => {
		Log({ message: `Payout initiated for pool ${poolId}` });

		payoutPool(poolId, (percentOrSet === "Percent" ? payoutPercent : payoutDigipogs), percentOrSet)
			.then((response) => {
				if (response?.success === false || response?.error) {
					globalMessageAPI.error(messageTemplates["user.pool.payout.failed"]);
					return;
				}
				Log({ message: `Payout successful for pool ${poolId}` });
				globalMessageAPI.success(messageTemplates["pool.payout.success"]);
				refreshPools();
			})
			.catch((error) => Log({ message: `Error paying out pool ${poolId}`, data: error, level: "error" }));
	};

	const handleDelete = (poolId: number) => {
		Log({ message: `Delete pool ${poolId}` });

		modal.warning({
			title: "Confirm Pool Deletion",
			content:
				"Are you sure you want to delete this pool? This action cannot be undone.",
			okText: "Delete",
			okType: "danger",
			cancelText: "Cancel",
			okCancel: true,
			onOk: () => {
				deletePool(poolId)
					.then((response) => {
						if (response?.success === false || response?.error) {
							globalMessageAPI.error(messageTemplates["pool.delete.failed"]);
							return;
						}
						Log({ message: `Pool ${poolId} deleted` });
						globalMessageAPI.success(messageTemplates["pool.deleted.success"]);
						refreshPools();
					})
					.catch((error) => Log({ message: `Error deleting pool ${poolId}`, data: error, level: "error" }));
			},
		});
	};

	const isOwner =
		Array.isArray(pool.owners) &&
		pool.owners.some((owner) => owner.id === Number(userData?.id));
	const ownerLabel = isOwner
		? "You"
		: Array.isArray(pool.owners) && pool.owners.length > 0
			? `${pool.owners[0].displayName}`
			: "N/A";

	const canManagePools = currentUserHasScope(userData, "global.pools.manage");

	return (
		<>
			{contextHolder}
			<Modal open={payoutModalOpen} onCancel={() => setPayoutModalOpen(false)} closable={false} title="Payout Pool" okType="primary" okText="Payout" onOk={() => handlePayout(pool.id)} cancelText="Cancel">
				<Text type="secondary" style={{fontSize: 14}}>You can payout a set amount of digipogs, or a percentage of the full amount.</Text>
				<Flex align="center" justify="space-between" gap={10} style={{marginTop: 20}}>
					<Segmented options={[
						"Percent",
						"Digipogs"
					]} onChange={setPercentOrSet} />
					{
						percentOrSet === 'Digipogs'
							? <>
								<InputNumber suffix="digipogs" style={{ width: 200 }} max={pool.amount} min={0} value={payoutDigipogs}  onChange={(e) => setPayoutDigipogs(e || 0)}/>
							</>
							: <>
								<InputNumber suffix="%" style={{ width: 200 }} max={100} min={0} value={payoutPercent} onChange={(e) => setPayoutPercent(e || 0)} />
							</>
					}
				</Flex>
			</Modal>

			<Card
				title={pool.name}
				styles={{
					title: {
						textAlign: "center",
					},
					body: {
						textAlign: "center",
						height: isOwner ? undefined : "calc(100% - 64px)",
						display: "flex",
						flexDirection: "column",
						justifyContent: "center",
						flex: "1 1 0",
					},
					root: {
						height: "100%",
						display: "flex",
						flexDirection: "column",
					},
				}}
				actions={
					isOwner && canManagePools
						? [
							<Tooltip
								mouseEnterDelay={0.5}
								title="Payout Funds"
								key="payout"
								placement="top"
								color="green"
							>
								<IonIcon
									icon={IonIcons.cashOutline}
									style={{ fontSize: "32px" }}
									onClick={() => setPayoutModalOpen(true)}
									key="payout"
								/>
							</Tooltip>,
							<Tooltip
								mouseEnterDelay={0.5}
								title="Delete Pool"
								key="delete"
								placement="top"
								color="red"
							>
								<IonIcon
									icon={IonIcons.trashOutline}
									style={{ fontSize: "32px" }}
									onClick={() => handleDelete(pool.id)}
									key="delete"
								/>
							</Tooltip>,
						] : []
				}
			>
				<p>{pool.description}</p>

				<Row gutter={[16, 16]} style={{ marginTop: "20px" }}>
					<Col span={12}>
						<Statistic
							title="Owner"
							value={ownerLabel}
							styles={{
								content: {
									textAlign: "center",
									display: "flex",
									justifyContent: "center",
								},
							}}
						/>
					</Col>
					<Col span={12}>
						<Statistic
							title="Balance"
							value={pool.amount}
							styles={{
								content: {
									textAlign: "center",
									display: "flex",
									justifyContent: "center",
								},
							}}
						/>
					</Col>
				</Row>
			</Card>
		</>
	);
}
