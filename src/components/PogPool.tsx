import {
	Card,
	Tooltip,
	Popover,
	Flex,
	Button,
	Input,
	Divider,
	Row,
	Col,
	Statistic,
	Modal,
	notification,
	Typography,
} from "antd";
import {
	payoutPool,
	addPoolMember,
	removePoolMember,
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

export default function PogPoolElement({
	pool,
	refreshPools,
}: {
	pool: PogPool;
	refreshPools: Function;
}) {
	const { userData } = useUserData();
	const [modal, contextHolder] = Modal.useModal();
	const [api, contextHolderNotification] = notification.useNotification();
	const [newPoolUserId, setNewPoolUserId] = useState("");

	const handlePayout = (poolId: number) => {
		Log({ message: `Payout initiated for pool ${poolId}` });

		modal.confirm({
			title: "Payout Pool",
			content:
				"How much would you like to pay out?",
			okText: "Payout",
			okType: "primary",
			cancelText: "Cancel",
			okCancel: true,
			onOk: () => {
				payoutPool(poolId)
					.then(() => {
						Log({ message: `Payout successful for pool ${poolId}` });
						refreshPools();
					})
					.catch((err) => {
						Log({
							message: `Error during payout for pool ${poolId}`,
							data: err,
							level: "error",
						});
						api["error"]({
							title: "Error During Payout",
							description: `Failed to payout the pool. Please try again.`,
							placement: "bottom",
						});
					});
			},
		});
	};

	const handleAddMember = (poolId: number) => {
		Log({ message: `Add user ${newPoolUserId} to pool ${poolId}` });
		addPoolMember(poolId, { userId: newPoolUserId })
			.then(() => {
				Log({
					message: `User ${newPoolUserId} added to pool ${poolId}`,
				});
				setNewPoolUserId("");
				refreshPools();
			})
			.catch((err) => {
				Log({
					message: `Error adding user ${newPoolUserId} to pool ${poolId}`,
					data: err,
					level: "error",
				});
				api["error"]({
					title: "Error Adding Member",
					description: `Failed to add user ${newPoolUserId} to the pool. Please try again.`,
					placement: "bottom",
				});
			});
	};

	const handleRemoveMember = (poolId: number, userId: string) => {
		Log({ message: `Remove user ${userId} from pool ${poolId}` });
		removePoolMember(poolId, { userId })
			.then(() => {
				Log({ message: `User ${userId} removed from pool ${poolId}` });
				setNewPoolUserId("");
				refreshPools();
			})
			.catch((err) => {
				Log({
					message: `Error removing user ${userId} from pool ${poolId}`,
					data: err,
					level: "error",
				});
				api["error"]({
					title: "Error Removing Member",
					description: `Failed to remove user ${userId} from the pool. Please try again.`,
					placement: "bottom",
				});
			});
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
					.then(() => {
						Log({ message: `Pool ${poolId} deleted` });
						refreshPools();
					})
					.catch((err) => {
						Log({
							message: `Error deleting pool ${poolId}`,
							data: err,
							level: "error",
						});
						api["error"]({
							title: "Error Deleting Pool",
							description: `Failed to delete the pool. Please try again.`,
							placement: "bottom",
						});
					});
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
	const memberList = Array.isArray(pool.members) ? pool.members : [];

	const canManagePools = currentUserHasScope(userData, "global.pools.manage");

	return (
		<>
			{contextHolder}
			{contextHolderNotification}
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
									onClick={() => handlePayout(pool.id)}
									key="payout"
								/>
							</Tooltip>,
							<Tooltip
								mouseEnterDelay={0.5}
								title="Add or Remove Members"
								key="addmember"
								placement="top"
								color="blue"
							>
								<Popover
									trigger={"click"}
									title="Member"
									content={
										<Flex vertical gap={8}>
											{memberList.map((member) => (
												<Flex
													key={member.id}
													justify="space-between"
													align="center"
													gap={8}
												>
													<Tooltip
														title={`User ID: ${member.id}`}
														placement="top"
														color="blue"
													>
														<Input
															disabled
															value={
																member.displayName
															}
														/>
													</Tooltip>
													<Tooltip
														title={`Remove ${member.displayName}`}
														placement="top"
														color="red"
													>
														<Button
															variant="solid"
															color="red"
															style={{
																aspectRatio:
																	"1",
															}}
															onClick={() =>
																handleRemoveMember(
																	pool.id,
																	String(
																		member.id,
																	),
																)
															}
														>
															<IonIcon
																icon={
																	IonIcons.personRemoveOutline
																}
															/>
														</Button>
													</Tooltip>
												</Flex>
											))}

											{memberList.length > 0 && (
												<Divider
													style={{
														margin: "10px 0",
													}}
												/>
											)}

											<Flex
												justify="space-between"
												align="center"
												gap={8}
											>
												<Input
													placeholder="User ID"
													value={newPoolUserId}
													onChange={(e) =>
														setNewPoolUserId(
															e.target.value,
														)
													}
												/>
												<Tooltip
													title={`Add User ${newPoolUserId}`}
													placement="top"
													color="green"
												>
													<Button
														variant="solid"
														color="green"
														style={{
															aspectRatio:
																"1",
														}}
														onClick={() => {
															handleAddMember(
																pool.id,
															);
														}}
													>
														<IonIcon
															icon={
																IonIcons.personAddOutline
															}
														/>
													</Button>
												</Tooltip>
											</Flex>
										</Flex>
									}
								>
									<IonIcon
										icon={IonIcons.peopleOutline}
										style={{ fontSize: "32px" }}
										key="addmember"
									/>
								</Popover>
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
				<Tooltip
					title={
						memberList.length > 0
							? memberList.map((m) => m.displayName).join(", ")
							: "No members"
					}
					mouseEnterDelay={0.5}
					placement="top"
					style={{
						width: "100%",
						marginTop: "10px",
						textAlign: "center",
					}}
					color="blue"
				>
					<Text type="secondary">Members: {memberList.length}</Text>
				</Tooltip>
			</Card>
		</>
	);
}
