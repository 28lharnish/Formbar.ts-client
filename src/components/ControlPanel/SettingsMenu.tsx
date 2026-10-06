import {
	Flex,
	QRCode,
	Typography,
	Input,
	Button,
	Space,
	Divider,
	Collapse,
	Modal,
	Tooltip,
	Card,
} from "antd";
const { Title, Text } = Typography;
import {
	getAppearAnimation,
	useClassData,
	useMobileDetect,
	useTheme,
	useUserData,
	useSettings,
} from "@/main";
import { useEffect, useState } from "react";
import Log from "@utils/debugLogger";
import {
	createClassLink,
	deleteClass,
	deleteClassLink,
	getAllClassLinks,
	getBannedClassStudents,
	kickAllStudents,
	regenerateClassCode,
	updateSettings,
} from "@api/classApi";
import { currentUserHasScope } from "@/utils/scopeUtils";
import StudentObject from "@components/StudentObject";
import type { Student } from "@/types";
import { useGlobalMessage } from "@/components/providers/GlobalMessageProvider";
import { messageTemplates } from "@utils/messageTemplates";

type BannedClassStudent = {
	id?: number;
	displayName?: string;
	email?: string;
	username?: string;
	reason?: string;
	bannedAt?: string;
	createdAt?: string;
	[key: string]: unknown;
};

export default function SettingsMenu() {
	const { settings } = useSettings();
	const frontendUrl =
		import.meta.env.VITE_FORMBAR_CLIENT_URL || "http://localhost:5173";
	const { userData } = useUserData();
	const { classData } = useClassData();
	const globalMessageAPI = useGlobalMessage();
	const isMobile = useMobileDetect();

	// const canManageSettings = currentUserHasScope(userData, 'class.session.settings');
	const canManageUsers =
		currentUserHasScope(userData, "class.students.ban") ||
		currentUserHasScope(userData, "class.students.kick");
	const canReadUsers = currentUserHasScope(userData, "class.students.read");
	const canManageLinks = currentUserHasScope(userData, "class.links.manage");
	const canDeleteClass = currentUserHasScope(
		userData,
		"class.system.can_delete_class",
	);
	const canKickStudents = currentUserHasScope(
		userData,
		"class.students.kick",
	);
	const canRegenerateCode = currentUserHasScope(
		userData,
		"class.session.regenerate_code",
	);
	const canRenameClass = currentUserHasScope(
		userData,
		"class.system.can_rename_class",
	);

	const [isQRModalOpen, setIsQRModalOpen] = useState(false);

	const [openModalId, setOpenModalId] = useState<number | null>(null);

	const [newLinkInput, setNewLinkInput] = useState<{
		name: string;
		url: string;
	}>({ name: "", url: "" });

	const [bannedStudents, setBannedStudents] = useState<BannedClassStudent[]>(
		[],
	);
	const [bannedSearchQuery, setBannedSearchQuery] = useState("");
	const [isBannedLoading, setIsBannedLoading] = useState(false);

	const [modal, contextHolderModal] = Modal.useModal();

	const students =
		classData && classData.students
			? (Object.values(classData.students) as Student[])
			: [];

	const [classLinks, setClassLinks] = useState<
		{ name: string; url: string }[]
	>([]);

	useEffect(() => {
		if (!classData) return;

		if (canManageLinks) {
			getAllClassLinks(classData.id)
				.then((links) => {
					setClassLinks(links);
				})
				.catch((err) => {
					Log({
						message: "Error fetching class links:",
						data: err,
						level: "error",
					});
				});
		}
	}, [classData]);

	useEffect(() => {
		if (!classData || !canManageUsers) {
			setBannedStudents([]);
			return;
		}

		setIsBannedLoading(true);
		getBannedClassStudents(classData.id)
			.then((response: any) => {
				const bannedList = Array.isArray(response?.data)
					? response.data
					: Array.isArray(response)
						? response
						: response?.items || response?.students || [];
				setBannedStudents(bannedList);
			})
			.catch((err) => {
				Log({
					message: "Error fetching banned students:",
					data: err,
					level: "error",
				});
			})
			.finally(() => {
				setIsBannedLoading(false);
			});
	}, [classData, canManageUsers]);

	const filteredBannedStudents = bannedStudents.filter((student) => {
		if (!bannedSearchQuery.trim()) return true;
		const query = bannedSearchQuery.trim().toLowerCase();
		return [
			student.displayName,
			student.email,
			student.username,
			student.reason,
		]
			.filter(Boolean)
			.some((value) => String(value).toLowerCase().includes(query));
	});

	function tryAddLink() {
		if (!canManageLinks) {
			globalMessageAPI.error(
				messageTemplates.class_links_permission_error,
			);
			return;
		}

		if (!newLinkInput.name || !newLinkInput.url) {
			globalMessageAPI.error(
				messageTemplates.class_links_fields_required_error,
			);
			return;
		}

		let fixedLink = {
			name: newLinkInput.name,
			url: "https://" + newLinkInput.url.replace(/^https?:\/\//, ""),
		};

		createClassLink(classData!.id, fixedLink)
			.then((data) => {
				if (data.success && !data.error) {
					setClassLinks([...classLinks, fixedLink]);
					setNewLinkInput({ name: "", url: "" });
					globalMessageAPI.success(
						messageTemplates.class_links_added_success,
					);
				} else {
					globalMessageAPI.error(
						messageTemplates.class_links_add_failed,
					);
				}
			})
			.catch((error) =>
				Log({
					message: "Error adding link:",
					data: error,
					level: "error",
				}),
			);
	}

	function removeLink(linkToRemove: { name: string; url: string }) {
		if (!canManageLinks) {
			globalMessageAPI.error(
				messageTemplates.class_links_permission_error,
			);
			return;
		}

		deleteClassLink(classData!.id, linkToRemove.name)
			.then((data) => {
				if (data.success && !data.error) {
					setClassLinks(
						classLinks.filter(
							(link) => link.url !== linkToRemove.url,
						),
					);
					globalMessageAPI.success(
						messageTemplates.class_links_removed_success,
					);
				} else {
					globalMessageAPI.error(
						messageTemplates.class_links_remove_failed,
					);
				}
			})
			.catch((error) =>
				Log({
					message: "Error removing link:",
					data: error,
					level: "error",
				}),
			);
	}

	const { isDark } = useTheme();

	return (
		<>
			{contextHolderModal}
			<Flex
				gap={50}
				style={{
					height: "100%",
					minHeight: 0,
					width: "100%",
					overflowY: "auto",
					padding: 20,
					paddingBottom: 8,
				}}
			>
				<Flex
					vertical
					style={{ width: "100%", minWidth: 0, paddingRight: 20 }}
				>
					<Title style={{ marginBottom: "0" }}>Settings</Title>
					<Divider />

					<Title level={3} style={{ marginTop: 0, marginBottom: 10 }}>
						General
					</Title>
					{classData?.key && (
						<Text
							type="secondary"
							style={{ marginBottom: 10, fontSize: 16 }}
						>
							Class Code:{" "}
							<Text code style={{ fontSize: 16 }}>
								{classData?.key}
							</Text>
						</Text>
					)}
					<Flex gap={30} align="center">
						<Flex vertical gap={20}>
							<Flex
								gap={10}
								style={{ width: isMobile ? "100%" : "600px" }}
								justify="center"
								align="center"
								vertical={isMobile}
							>
								<Input
									placeholder="Class Name"
									defaultValue={classData?.className}
								/>
								{canRenameClass && (
									<Button
										type="primary"
										onClick={() => {
											if (!canRenameClass || !classData)
												return;

											updateSettings(classData.id, {
												name: classData.className,
											})
												.then((response) => {
													if (
														response?.success ===
															false ||
														response?.error
													) {
														globalMessageAPI.error(
															messageTemplates.class_name_update_failed,
														);
														return;
													}
													globalMessageAPI.success(
														messageTemplates.class_name_updated_success,
													);
												})
												.catch((error) =>
													Log({
														message:
															"Error updating class name",
														data: error,
														level: "error",
													}),
												);
										}}
									>
										Change Class Name
									</Button>
								)}
							</Flex>

							{isMobile && (
								<Flex align="center" justify="center">
									<Tooltip
										title="Tap to enlarge"
										mouseEnterDelay={0.5}
									>
										<QRCode
											value={
												frontendUrl +
												"/joinClass?code=" +
												classData?.key
											}
											bordered={false}
											size={70}
											style={{ cursor: "pointer" }}
											iconSize={20}
											type="svg"
											icon="/img/FormbarLogo-Circle.png"
											onClick={() => {
												setIsQRModalOpen(true);
											}}
										/>
									</Tooltip>
								</Flex>
							)}

							<Flex
								gap={10}
								style={{ width: isMobile ? "100%" : "600px" }}
								justify="center"
								align="center"
								vertical={isMobile}
							>
								{canKickStudents && (
									<Button
										variant="solid"
										color="danger"
										onClick={() => {
											if (!canKickStudents || !classData)
												return;

											kickAllStudents(classData.id)
												.then((response) => {
													if (
														response?.success ===
															false ||
														response?.error
													) {
														globalMessageAPI.error(
															messageTemplates.class_students_kick_failed,
														);
														return;
													}
													globalMessageAPI.success(
														messageTemplates.class_students_kicked_success,
													);
												})
												.catch((error) =>
													Log({
														message:
															"Error kicking all students",
														data: error,
														level: "error",
													}),
												);
										}}
									>
										Kick All Students
									</Button>
								)}
								{canRegenerateCode && (
									<Button
										variant="solid"
										color="danger"
										onClick={() => {
											if (
												!canRegenerateCode ||
												!classData
											)
												return;

											regenerateClassCode(classData.id)
												.then((response) => {
													if (
														response?.success ===
															false ||
														response?.error
													) {
														globalMessageAPI.error(
															messageTemplates.class_code_regenerate_failed,
														);
														return;
													}
													globalMessageAPI.success(
														messageTemplates.class_code_regenerated_success,
													);
												})
												.catch((error) =>
													Log({
														message:
															"Error regenerating class code",
														data: error,
														level: "error",
													}),
												);
										}}
									>
										Regenerate Code
									</Button>
								)}

								{canDeleteClass && (
									<Button
										variant="solid"
										color="danger"
										onClick={() => {
											if (!canDeleteClass || !classData)
												return;

											modal.warning({
												title: "Are you sure you want to delete this class?",
												centered: true,
												content:
													"This action is irreversible, and you will not be able to recover this class.",
												okCancel: true,
												onOk: () => {
													deleteClass(classData!.id)
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
															},
														)
														.catch((error) => {
															Log({
																message:
																	"Failed to delete class:",
																data: error,
																level: "error",
															});
															Log({
																message:
																	"Failed to delete class:",
																data: error,
																level: "error",
															});
														});
												},
											});
										}}
									>
										Delete Class
									</Button>
								)}
							</Flex>
						</Flex>

						{!isMobile && (
							<Flex
								vertical
								gap={10}
								align="center"
								justify="center"
								style={{
									borderLeft: `2px solid ${isDark ? "#fff2" : "#0002"}`,
									paddingLeft: 20,
								}}
							>
								<Tooltip
									title="Click to enlarge"
									mouseEnterDelay={0.5}
								>
									<QRCode
										value={
											frontendUrl +
											"/joinClass?code=" +
											classData?.key
										}
										bordered={false}
										size={150}
										style={{ cursor: "pointer" }}
										type="svg"
										icon="/img/FormbarLogo-Circle.png"
										onClick={() => {
											setIsQRModalOpen(true);
										}}
									/>
								</Tooltip>

								<Text
									strong
									type="secondary"
									style={{ fontSize: 16 }}
								>
									Scan to join class
								</Text>
							</Flex>
						)}
						<Modal
							open={isQRModalOpen}
							title="Join Class"
							footer={null}
							centered
							onCancel={() => {
								setIsQRModalOpen(false);
							}}
						>
							<QRCode
								value={
									frontendUrl +
									"/joinClass?code=" +
									classData?.key
								}
								bordered={false}
								style={{
									width: "100%",
									aspectRatio: 1,
									height: "unset",
								}}
								type="svg"
								icon="/img/FormbarLogo-Circle.png"
							/>
						</Modal>
					</Flex>

					{canManageLinks && (
						<>
							<Divider />

							<Title level={3}>Links</Title>

							<Flex
								justify="end"
								align="center"
								style={{ width: "100%" }}
								vertical={isMobile}
								gap={isMobile ? 10 : undefined}
							>
								<Input
									placeholder="Link Name"
									style={{
										width: "200px",
										marginRight: 10,
										...(isMobile && {
											marginRight: 0,
											width: "100%",
										}),
									}}
									value={newLinkInput.name}
									onChange={(e) =>
										setNewLinkInput({
											...newLinkInput,
											name: e.target.value,
										})
									}
								/>
								<Space.Compact
									style={{
										width: "100%",
										...(isMobile && {
											marginRight: 0,
											width: "100%",
										}),
									}}
								>
									<Space.Addon>https://</Space.Addon>
									<Input
										placeholder="example.com"
										value={newLinkInput.url}
										onChange={(e) =>
											setNewLinkInput({
												...newLinkInput,
												url: e.target.value,
											})
										}
									/>
								</Space.Compact>
								<Button
									type="primary"
									style={{
										marginLeft: 10,
										width: "100px",
										...(isMobile && {
											marginLeft: 0,
											width: "100%",
										}),
									}}
									onClick={() => tryAddLink()}
								>
									Add Link
								</Button>
							</Flex>

							<Collapse
								style={{ width: "100%", marginTop: 20 }}
								bordered={false}
								items={[
									{
										key: 1,
										label: "Added Links",
										children: (
											<Flex vertical>
												{classLinks.length > 0 &&
													classLinks.map(
														(link, index) => (
															<Flex
																key={index}
																justify="space-between"
																align="center"
																style={{
																	width: "100%",
																	borderBottom:
																		"1px solid var(--antd-border-color)",
																	paddingBottom: 10,
																	marginBottom: 10,
																}}
															>
																<Input
																	style={{
																		width: "200px",
																		marginRight: 10,
																	}}
																	value={
																		link.name
																	}
																	readOnly
																/>
																<Input
																	style={{
																		width: "100%",
																	}}
																	value={
																		link.url
																	}
																	readOnly
																/>
																<Button
																	variant="solid"
																	color="danger"
																	style={{
																		marginLeft: 10,
																		width: "100px",
																	}}
																	onClick={() =>
																		removeLink(
																			link,
																		)
																	}
																>
																	Remove
																</Button>
															</Flex>
														),
													)}
											</Flex>
										),
									},
								]}
							/>
						</>
					)}

					{canManageUsers && !isBannedLoading && (
						<>
							<Divider />

							<Title level={3}>Banned Users</Title>
							<Flex vertical gap={16}>
								<Flex gap={12} wrap>
									<Card
										size="small"
										style={{ minWidth: 180 }}
									>
										<Flex vertical>
											<Text type="secondary">
												Total banned
											</Text>
											<Title
												level={2}
												style={{ margin: 0 }}
											>
												{bannedStudents.length}
											</Title>
										</Flex>
									</Card>
									<Card
										size="small"
										style={{ minWidth: 220 }}
									>
										<Flex vertical>
											<Text type="secondary">
												Visible in filter
											</Text>
											<Title
												level={2}
												style={{ margin: 0 }}
											>
												{filteredBannedStudents.length}
											</Title>
										</Flex>
									</Card>
								</Flex>

								<Input
									placeholder="Search banned users"
									value={bannedSearchQuery}
									onChange={(e) =>
										setBannedSearchQuery(e.target.value)
									}
									style={{ maxWidth: 420 }}
								/>

								<div
									style={{
										display: isMobile ? "flex" : "grid",
										flexDirection: isMobile
											? "column"
											: "unset",
										gridTemplateColumns: isMobile
											? "unset"
											: "repeat(auto-fill, minmax(200px, 1fr))",
										gap: "16px",
										width: "100%",
										overflowY: isMobile
											? "scroll"
											: "unset",
										padding: isMobile ? "20px 15px" : "0",
										paddingBottom: isMobile ? 0 : "20px",
									}}
								>
									{canReadUsers &&
										students
											.filter((student) =>
												student.displayName
													.toLowerCase()
													.includes(
														bannedSearchQuery.toLowerCase(),
													),
											)
											.filter((student) =>
												bannedStudents.some(
													(banned) =>
														banned.id ===
														student.id,
												),
											)
											.map(
												(
													student: any,
													index: number,
												) =>
													student.id !==
													userData?.id ? (
														<StudentObject
															style={getAppearAnimation(
																settings
																	.accessibility
																	.disableAnimations,
																index,
															)}
															key={student.id}
															student={student}
															openModalId={
																openModalId
															}
															setOpenModalId={
																setOpenModalId
															}
														/>
													) : null,
											)}
								</div>
							</Flex>
						</>
					)}
				</Flex>
			</Flex>
		</>
	);
}
