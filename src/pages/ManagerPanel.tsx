import FormbarHeader from "@components/FormbarHeader";
import Log from "@utils/debugLogger";
import {
	Segmented,
	Typography,
	Row,
	Col,
	Card,
	Button,
	Flex,
	Tooltip,
	Input,
	Skeleton,
	Modal,
	Switch,
} from "antd";

const { Title, Text } = Typography;

import { IonIcon } from "@ionic/react";
import * as IonIcons from "ionicons/icons";
import { Activity, useEffect, useState } from "react";
import { accessToken } from "@utils/socket";
import {
	useSettings,
	useMobileDetect,
	useUserData,
} from "@/main";
import {
	banUser,
	deleteUser,
	unbanUser,
	verifyUser,
	updateUserPermissions,
} from "@api/userApi";
import {
	addIpToList,
	deleteIpFromList,
	getAllIpAccessList,
	getManagerData,
	toggleIpList,
	updateIpFromList,
} from "@api/managerApi";
import { deleteClass } from "@api/classApi";
import { SCOPES } from "@/types";
import { currentUserHasScope } from "@/utils/scopeUtils";
import { useGlobalMessage } from "@/components/providers/GlobalMessageProvider";
import { messageTemplates } from "@utils/messageTemplates";
import CustomPagination from "@/components/CustomPagination";
import ManagerPanelUserCard from "@/components/ManagerPanelUserCard";

export type ManagerPanelUser = {
	id: number | string;
	email: string;
	permissions: number;
	scopes?: string[];
	displayName?: string;
	verified: number | boolean;
};

const DEFAULT_PAGE_SIZE = 24;

function isBannedUser(user: ManagerPanelUser): boolean {
	return (
		Number(user.permissions) === 0 ||
		(user.scopes || []).includes(SCOPES.GLOBAL.SYSTEM.actions.BLOCKED.key)
	);
}

export default function ManagerPanel() {
	const [listCategory, setListCategory] = useState<
		"Users" | "IP Addresses" | "Classrooms" | "Banned Users"
	>("Users");

	const { userData } = useUserData();
	const globalMessageAPI = useGlobalMessage();

	const [ipListData, setIpListData] = useState<{
		active: boolean;
		ips: { id: number; ip: string }[];
	}>({ active: false, ips: [] });
	const [selectedIpList, setSelectedIpList] = useState<
		"whitelist" | "blacklist"
	>("whitelist");
	const [newIpText, setNewIpText] = useState("");
	const [showIpModal, setShowIpModal] = useState(false);
	const [isNewIpValid, setIsNewIpValid] = useState(false);

	const [classrooms, setClassrooms] = useState<any[]>([]);

	const [users, setUsers] = useState<ManagerPanelUser[]>([]);
	const [bannedUsers, setBannedUsers] = useState<ManagerPanelUser[]>([]);
	const [initialLoad, setInitialLoad] = useState(true);
	const [isLoading, setIsLoading] = useState(true);
	const [sortBy, setSortBy] = useState<"name" | "permission">("name");

	const [searchQuery, setSearchQuery] = useState("");
	const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
	const [totalUsers, setTotalUsers] = useState(0);
	const [currentPage, setCurrentPage] = useState(1);
	const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
	const [refreshNonce, setRefreshNonce] = useState(0);

	const [editingIpId, setEditingIpId] = useState<number | null>(null);
	const [editingIpValue, setEditingIpValue] = useState("");
	const [isIpValid, setIsIpValid] = useState(false);

	const ipRegex =
		/^((25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)\.){3}(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\/(3[0-2]|[12]?\d))?$/;
	const validateIp = (ip: string) => ipRegex.test(ip);

	const [modal, contextModal] = Modal.useModal();
	const { settings } = useSettings();

	useEffect(() => {
		const timeout = setTimeout(() => {
			setDebouncedSearchQuery(searchQuery.trim());
		}, 250);
		return () => clearTimeout(timeout);
	}, [searchQuery]);

	const isMobile = useMobileDetect();

	const updateManagerData = (
		ipList: "whitelist" | "blacklist" = selectedIpList,
	) => {
		const offset = (currentPage - 1) * pageSize;

		getManagerData(offset, pageSize, sortBy, debouncedSearchQuery)
			.then((response) => {
				const { data } = response;
				Log({ message: "Manager panel data", data });

				const userItems = [
					...(Array.isArray(data?.users) ? data.users : []),
				];

				const unbannedUsers = userItems.filter(
					(user: ManagerPanelUser) => !isBannedUser(user),
				);
				const bannedUserItems = userItems.filter(
					(user: ManagerPanelUser) => isBannedUser(user),
				);

				setClassrooms(data?.classrooms || []);
				setUsers(unbannedUsers);
				setBannedUsers(bannedUserItems);

				setTotalUsers(data?.pagination?.total || unbannedUsers.length);
			})
			.catch((err) => {
				if (err?.name === "AbortError") {
					return;
				}
				Log({
					message: "Error fetching manager panel data",
					data: err,
					level: "error",
				});
			})
			.finally(() => {
				setIsLoading(false);
			});

		if (listCategory === "IP Addresses") {
			updateIpListData(ipList);
		}
	};

	const updateIpListData = (ipList: "whitelist" | "blacklist") => {
		getAllIpAccessList(ipList === "whitelist")
			.then((response) => {
				const { data } = response;
				Log({ message: `IP ${ipList} data`, data });
				setIpListData(data);
			})
			.catch((err) => {
				Log({
					message: `Error fetching IP ${ipList} data`,
					data: err,
					level: "error",
				});
			});
	};

	useEffect(() => {
		if (!accessToken) return;

		updateManagerData();
	}, [
		accessToken,
		currentPage,
		pageSize,
		sortBy,
		debouncedSearchQuery,
		refreshNonce,
		listCategory,
	]);

	useEffect(() => {
		// After users load, wait for animation to complete then disable it
		if (users.length > 0 && initialLoad) {
			const animationDuration = (users.length * 0.05 + 0.3) * 1000;
			const timer = setTimeout(() => {
				setInitialLoad(false);
			}, animationDuration);
			return () => clearTimeout(timer);
		}
	}, [users, initialLoad]);

	function handleVerify(userId: number | string) {
		verifyUser(String(userId))
			.then((response) => {
				const { data } = response;
				if (response?.success === false || response?.error) {
					globalMessageAPI.error(messageTemplates.user_verify_failed);
					return;
				}
				Log({ message: "User verified", data });
				globalMessageAPI.success(
					messageTemplates.user_verified_success,
				);
				setIsLoading(true);
				setInitialLoad(false);
				setCurrentPage(1);
				setRefreshNonce((value) => value + 1);
			})
			.catch((err) => {
				Log({
					message: "Error verifying user",
					data: err,
					level: "error",
				});
			});
	}

	function deleteUserButton(userId: number | string) {
		const targetUser =
			users.find((e) => e.id == userId) ??
			bannedUsers?.find((e) => e.id == userId);
		const userLabel =
			targetUser?.displayName || targetUser?.email || "This user";
		modal.warning({
			centered: true,
			title: "Are you sure you want to delete this user?",
			content: `${userLabel} will be unable to log in and removed from all classes.`,
			okCancel: true,
			onOk: () => {
				deleteUser(String(userId))
					.then(async (res) => {
						if (!res.ok) {
							Log({
								message: "Failed to delete user:",
								data: res,
								level: "error",
							});
							return;
						}
						if (res?.success) {
							globalMessageAPI.success(
								messageTemplates.user_deleted_success,
							);
							setIsLoading(true);
							setInitialLoad(false);
							setRefreshNonce((value) => value + 1);
						} else {
							globalMessageAPI.error(
								messageTemplates.user_delete_failed,
							);
						}
					})
					.catch((err) => {
						Log({
							message: "Error deleting user:",
							data: err,
							level: "error",
						});
					});
			},
		});
	}

	function banUserButton(userId: number | string) {
		const user =
			users.find((e) => e.id == userId) ??
			(typeof bannedUsers !== "undefined"
				? bannedUsers.find(
						(e: { id: number | string }) => e.id == userId,
					)
				: undefined);
		const displayName = user?.displayName ?? "This user";
		modal.warning({
			centered: true,
			title: "Are you sure you want to ban this user?",
			content: `${displayName} will be unable to login or create a new account with this email`,
			okCancel: true,
			onOk: () => {
				banUser(String(userId))
					.then(async (res) => {
						if (!res.ok) {
							Log({
								message: "Failed to ban user:",
								data: res,
								level: "error",
							});
							return;
						}
						if (res?.success) {
							globalMessageAPI.success(
								messageTemplates.user_banned_success,
							);
							setIsLoading(true);
							setInitialLoad(false);
							setRefreshNonce((value) => value + 1);
						} else {
							globalMessageAPI.error(
								messageTemplates.user_banned_failed,
							);
						}
					})
					.catch((err) => {
						Log({
							message: "Error banning user:",
							data: err,
							level: "error",
						});
					});
			},
		});
	}

	function unbanUserButton(userId: number | string) {
		const user =
			users.find((e) => e.id == userId) ??
			(typeof bannedUsers !== "undefined"
				? bannedUsers.find(
						(e: { id: number | string }) => e.id == userId,
					)
				: undefined);

		const displayName = user?.displayName ?? "This user";

		modal.warning({
			centered: true,
			title: "Are you sure you want to unban this user?",
			content: `${displayName} will now be able to login or create a new account with this email`,
			okCancel: true,
			onOk: () => {
				unbanUser(String(userId))
					.then(async (res) => {
						if (!res.ok) {
							Log({
								message: "Failed to unban user:",
								data: res,
								level: "error",
							});
							return;
						}

						if (res?.success) {
							globalMessageAPI.success(
								messageTemplates.user_unbanned_success,
							);
							setIsLoading(true);
							setInitialLoad(false);
							setRefreshNonce((value) => value + 1);
						} else {
							globalMessageAPI.error(
								messageTemplates.user_unbanned_failed,
							);
						}
					})
					.catch((err) => {
						Log({
							message: "Error unbanning user:",
							data: err,
							level: "error",
						});
					});
			},
		});
	}

	function handlePermissionChange(
		userId: number | string,
		permission: number,
	) {
		updateUserPermissions(String(userId), { perm: permission })
			.then((response) => {
				if (!response.ok) {
					throw new Error(
						response.detail ||
							response.message ||
							"Failed to update user permissions.",
					);
				}
				setRefreshNonce((value) => value + 1);
			})
			.catch((err) => {
				Log({
					message: "Error updating user permissions:",
					data: err,
					level: "error",
				});
				globalMessageAPI.error("Failed to update user permissions.");
			});
	}

	const canManageUsers = currentUserHasScope(userData, "global.users.manage");

	return (
		<>
			{contextModal}
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					height: "100vh",
				}}
			>
				<FormbarHeader />

				<div
					style={{
						display: isMobile ? "flex" : "grid",
						flexDirection: 'column',
						gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
						alignItems: "center",
						marginInline: 16,
						marginBlock: 10
					}}
				>
					{
						!isMobile && (
							<Title
								style={{
									textAlign: "center",
									marginBottom: "0",
								}}
							>
								Manager Panel
							</Title>
						)
					}

					<Activity
						mode={listCategory === "Users" ? "visible" : "hidden"}
					>
						<Flex
							style={{
								gap: 10,
								alignItems: "center",
								justifyContent: "center",
								width: isMobile ? "100%" : "initial",
								marginBottom: isMobile ? 8 : 0
							}}
						>
							<Button
								variant="solid"
								color={sortBy === "name" ? "primary" : undefined}
								onClick={() => {
									setCurrentPage(1);
									setIsLoading(true);
									setInitialLoad(true);
									setSortBy("name");
								}}
							>
								Name
							</Button>
							<Button
								variant="solid"
								color={
									sortBy === "permission"
										? "primary"
										: undefined
								}
								onClick={() => {
									setCurrentPage(1);
									setIsLoading(true);
									setInitialLoad(true);
									setSortBy("permission");
								}}
							>
								Permission
							</Button>
							<Input
								placeholder={isMobile ? "Search" : "Search users..."}
								style={{ width: "auto" }}
								value={searchQuery}
								onChange={(e) => {
									setCurrentPage(1);
									setIsLoading(true);
									setInitialLoad(true);
									setSearchQuery(e.target.value);
								}}
							/>
						</Flex>
					</Activity>

					<Activity
						mode={listCategory === "Users" ? "hidden" : "visible"}
						children={<p></p>}
					/>

					<Segmented
						options={!isMobile ? [
							"Users",
							"Classrooms",
							"IP Addresses",
							"Banned Users",
						]: [
							{ value: "Users", icon: <IonIcon icon={IonIcons.person} /> },
							{ value: "Classrooms", icon: <IonIcon icon={IonIcons.easel} /> },
							{ value: "IP Addresses", icon: <IonIcon icon={IonIcons.globe} /> },
							{ value: "Banned Users", icon: <IonIcon icon={IonIcons.ban} /> },
						]}

						style={{
							width: isMobile ? "100%" : 'max-content',
							marginLeft: isMobile ? "none" : 'auto'
						}}

						styles={{
							item: {
								width: isMobile ? "100%" : "initial"
							}
						}}

						onChange={(value) => {
							if (value === "Users") {
								setIsLoading(true);
								setInitialLoad(true);
							}
							setListCategory(
								value as
									"Users" | "IP Addresses" | "Banned Users",
							);
						}}
						value={listCategory}
					/>
				</div>

				<div
					style={{
						flex: 1,
						overflowY: "auto",
						paddingBottom: "80px",
					}}
				>
					{canManageUsers ? (
						<>
							<Activity
								mode={
									listCategory === "Users"
										? "visible"
										: "hidden"
								}
							>
								{isMobile ? (
									<Flex
										vertical
										gap={10}
										style={{ margin: "10px" }}
									>
										{users.length > 0 ? (
											users.map((user, index) =>
												<ManagerPanelUserCard
													key={`user-card-${user.id}`}
													user={user}
													index={index}
													mobileCard
													isMobile={isMobile}
													initialLoad={initialLoad}
													isLoading={isLoading}
													settings={settings}
													onVerify={handleVerify}
													onBan={banUserButton}
													onUnban={unbanUserButton}
													onDelete={deleteUserButton}
													onPermissionChange={
														handlePermissionChange
													}
												/>
											)
										) : (
											<Flex
												justify="center"
												style={{ width: "100%" }}
											>
												<Skeleton active></Skeleton>
											</Flex>
										)}
									</Flex>
								) : (
									<Row
										gutter={[8, 8]}
										style={{
											marginInline: "10px",
											paddingBottom: 36,
											justifyContent: "center",
										}}
									>
										{users.length > 0 ? (
											users.map((user, index) =>
												<ManagerPanelUserCard
													key={`user-card-${user.id}`}
													user={user}
													index={index}
													mobileCard={false}
													isMobile={isMobile}
													initialLoad={initialLoad}
													isLoading={isLoading}
													settings={settings}
													onVerify={handleVerify}
													onBan={banUserButton}
													onUnban={unbanUserButton}
													onDelete={deleteUserButton}
													onPermissionChange={
														handlePermissionChange
													}
												/>
											)
										) : (
											<Flex
												justify="center"
												style={{ width: "100%" }}
											>
												<Skeleton></Skeleton>
											</Flex>
										)}
									</Row>
								)}
								{totalUsers > 0 && (
									<Flex
										justify="center"
										style={{
											margin: 0,
											position: "absolute",
											justifySelf: 'center',
											bottom: 8,
											width: '100%'
										}}
									>
										<CustomPagination
											currentPage={currentPage}
											pageSize={pageSize}
											total={totalUsers}
											
											onChange={(page, size) => {
												setIsLoading(true);
												setInitialLoad(true);
												setCurrentPage(page);
												setPageSize(size);
											}}
										/>
									</Flex>
								)}
							</Activity>
							<Activity
								mode={
									listCategory === "Classrooms"
										? "visible"
										: "hidden"
								}
							>
								<Row gutter={[8, 8]} style={{ marginInline: "10px" }}>
									{classrooms.length > 0 ? (
										classrooms.map((classroom: any) => (
											<Col
												span={6}
												key={`classroom-col-${classroom.id}`}
											>
												<Card
													title={classroom.name}
													style={{
														textAlign: "center",
													}}
												>
													<Text
														type="secondary"
														style={{
															marginRight: 10,
														}}
													>
														ID: {classroom.id}
													</Text>
													<Button
														color="red"
														type="primary"
														variant="solid"
														onClick={() => {
															deleteClass(
																classroom.id,
															)
																.then(
																	async (
																		response,
																	) => {
																		if (
																			!response.ok
																		) {
																			const message =
																				(response &&
																					(response.detail ||
																						response.message)) ||
																				"Failed to delete class.";
																			throw new Error(
																				message,
																			);
																		}
																		Log({
																			message:
																				"Class deleted:",
																			data: response.data,
																		});
																		globalMessageAPI.success(
																			messageTemplates.class_deleted_success,
																		);
																		setIsLoading(
																			true,
																		);
																		setInitialLoad(
																			false,
																		);
																		setRefreshNonce(
																			(
																				value,
																			) =>
																				value +
																				1,
																		);
																	},
																)
																.catch(
																	(error) => {
																		Log({
																			message:
																				"Failed to delete class:",
																			data: error,
																			level: "error",
																		});
																		globalMessageAPI.error(
																			(error &&
																				error.message) ||
																				messageTemplates.class_delete_failed,
																		);
																	},
																);
														}}
													>
														Delete Class
													</Button>
												</Card>
											</Col>
										))
									) : (
										<Flex
											justify="center"
											style={{ width: "100%" }}
										>
											<Skeleton active></Skeleton>
										</Flex>
									)}
								</Row>
							</Activity>
							<Activity
								mode={
									listCategory === "IP Addresses"
										? "visible"
										: "hidden"
								}
							>
								<Flex
									justify="center"
									align="center"
									gap={10}
									wrap
									style={{ margin: "10px" }}
								>
									<Segmented
										options={["Whitelist", "Blacklist"]}
										onChange={(value) => {
											const nextIpList =
												value.toLowerCase() as
													"whitelist" | "blacklist";
											setSelectedIpList(nextIpList);
											updateIpListData(nextIpList);
										}}
									/>
									<Modal
										title={`Add IP to ${selectedIpList}`}
										open={showIpModal}
										onCancel={() => {
											setNewIpText("");
											setIsNewIpValid(false);
											setShowIpModal(false);
										}}
										onOk={() => {
											if (isNewIpValid && newIpText) {
												addIpToList(
													selectedIpList ===
														"whitelist",
													newIpText,
												)
													.then(() => {
														setNewIpText("");
														setIsNewIpValid(false);
														updateIpListData(
															selectedIpList,
														);
														setShowIpModal(false);
													})
													.catch((err) => {
														Log({
															message: `Error adding IP to ${selectedIpList}:`,
															data: err,
															level: "error",
														});
													});
											}
										}}
										okButtonProps={{
											disabled: !isNewIpValid,
										}}
									>
										<Input
											placeholder="Enter IP address (e.g., 192.168.1.1)"
											value={newIpText}
											onChange={(e) => {
												setNewIpText(e.target.value);
												setIsNewIpValid(
													validateIp(e.target.value),
												);
											}}
											status={
												newIpText && !isNewIpValid
													? "error"
													: undefined
											}
										/>
									</Modal>
									<Tooltip
										mouseEnterDelay={0.5}
										title={`Add IP to ${selectedIpList}`}
										color="blue"
									>
										<Button
											variant="solid"
											color="blue"
											onClick={() => setShowIpModal(true)}
										>
											<IonIcon icon={IonIcons.add} />
										</Button>
									</Tooltip>
									<Tooltip
										mouseEnterDelay={0.5}
										title={`Toggle ${selectedIpList.charAt(0).toUpperCase() + selectedIpList.slice(1)} Active`}
										color={
											ipListData.active ? "green" : "red"
										}
									>
										<Switch
											checked={ipListData.active}
											onChange={() => {
												toggleIpList(
													selectedIpList ===
														"whitelist",
												);
												updateIpListData(
													selectedIpList,
												);
											}}
										/>
									</Tooltip>
								</Flex>
								<div>
									<Row
										gutter={[8, 8]}
										style={{ marginInline: "10px" }}
									>
										{ipListData.ips.length > 0 ? (
											ipListData.ips.map(({ id, ip }) => (
												<Col
													span={8}
													key={`ip-col-${id}`}
												>
													<Card
														key={`whitelist-ip-${id}`}
														style={{
															marginBottom:
																"10px",
														}}
													>
														<Flex
															gap={8}
															align="center"
														>
															<Input
																value={
																	editingIpId ===
																	id
																		? editingIpValue
																		: ip
																}
																disabled={
																	editingIpId !==
																	id
																}
																onChange={(
																	e,
																) => {
																	setEditingIpValue(
																		e.target
																			.value,
																	);
																	setIsIpValid(
																		validateIp(
																			e
																				.target
																				.value,
																		),
																	);
																}}
																status={
																	editingIpId ===
																		id &&
																	editingIpValue &&
																	!isIpValid
																		? "error"
																		: undefined
																}
															/>

															{editingIpId ===
															id ? (
																<>
																	<Button
																		variant="solid"
																		color="green"
																		style={{
																			marginLeft:
																				"auto",
																		}}
																		disabled={
																			!isIpValid
																		}
																		onClick={() => {
																			updateIpFromList(
																				selectedIpList ===
																					"whitelist",
																				String(
																					id,
																				),
																				editingIpValue,
																			)
																				.then(
																					() => {
																						setEditingIpId(
																							null,
																						);
																						setEditingIpValue(
																							"",
																						);
																						updateIpListData(
																							selectedIpList,
																						);
																					},
																				)
																				.catch(
																					(
																						err,
																					) => {
																						Log(
																							{
																								message: `Error updating IP in ${selectedIpList}:`,
																								data: err,
																								level: "error",
																							},
																						);
																					},
																				);
																		}}
																	>
																		<IonIcon
																			icon={
																				IonIcons.checkmark
																			}
																		/>
																	</Button>
																	<Button
																		variant="solid"
																		color="default"
																		style={{
																			marginLeft:
																				"auto",
																		}}
																		onClick={() => {
																			setEditingIpId(
																				null,
																			);
																			setEditingIpValue(
																				"",
																			);
																			setIsIpValid(
																				false,
																			);
																		}}
																	>
																		<IonIcon
																			icon={
																				IonIcons.close
																			}
																		/>
																	</Button>
																</>
															) : (
																<>
																	<Button
																		variant="solid"
																		color="blue"
																		style={{
																			marginLeft:
																				"auto",
																		}}
																		onClick={() => {
																			setEditingIpId(
																				id,
																			);
																			setEditingIpValue(
																				ip,
																			);
																			setIsIpValid(
																				validateIp(
																					ip,
																				),
																			);
																		}}
																	>
																		<IonIcon
																			icon={
																				IonIcons.pencil
																			}
																		/>
																	</Button>

																	<Button
																		variant="solid"
																		color="red"
																		style={{
																			marginLeft:
																				"auto",
																		}}
																		onClick={() =>
																			deleteIpFromList(
																				selectedIpList ===
																					"whitelist",
																				id,
																			)
																				.then(
																					() =>
																						updateIpListData(
																							selectedIpList,
																						),
																				)
																				.catch(
																					(
																						err,
																					) => {
																						Log(
																							{
																								message: `Error deleting IP from ${selectedIpList}:`,
																								data: err,
																								level: "error",
																							},
																						);
																						Modal.error(
																							{
																								title: "Failed to delete IP",
																								content:
																									"An error occurred while deleting the IP address. Please try again.",
																							},
																						);
																					},
																				)
																		}
																	>
																		<IonIcon
																			icon={
																				IonIcons.trash
																			}
																		/>
																	</Button>
																</>
															)}
														</Flex>
													</Card>
												</Col>
											))
										) : (
											<Flex
												justify="center"
												style={{ width: "100%" }}
											>
												No IPs found
											</Flex>
										)}
									</Row>
								</div>
							</Activity>
							<Activity
								mode={
									listCategory === "Banned Users"
										? "visible"
										: "hidden"
								}
							>
								<Row gutter={[8, 8]} style={{ marginInline: "10px" }}>
									{bannedUsers.length > 0 ? (
										bannedUsers.map((user, index) =>
											<ManagerPanelUserCard
												key={`user-card-${user.id}`}
												user={user}
												index={index}
												mobileCard={false}
												isMobile={isMobile}
												initialLoad={initialLoad}
												isLoading={isLoading}
												settings={settings}
												onVerify={handleVerify}
												onBan={banUserButton}
												onUnban={unbanUserButton}
												onDelete={deleteUserButton}
												onPermissionChange={
													handlePermissionChange
												}
											/>
										)
									) : (
										<Flex
											justify="center"
											style={{ width: "100%" }}
										>
											<Text type="secondary">
												Could not find any banned users.
											</Text>
										</Flex>
									)}
								</Row>
							</Activity>
						</>
					) : (
						<Flex justify="center" style={{ width: "100%" }}>
							<Skeleton active>
								<Text>
									You are not authorized to manage users.
								</Text>
								<Text type="secondary">
									How did you get here?
								</Text>
							</Skeleton>
						</Flex>
					)}
				</div>
			</div>
		</>
	);
}
