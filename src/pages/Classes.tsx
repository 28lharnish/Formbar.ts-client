import { Button, Card, Flex, Input, Modal, Select, Typography } from "antd";
const { Title, Text } = Typography;
import FormbarHeader from "@components/FormbarHeader";
import Log from "@utils/debugLogger";
import { useUserData, useSettings, getAppearAnimation } from "@/main";
import type { CardProps } from "antd/es/card/Card";
import { useMobileDetect } from "@/main";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllUserClasses, getMe } from "@api/userApi";
import { joinClassSession, createClass as createClassAPI, deleteClass as deleteClassAPI, enrollInClass } from "@api/classApi";
import { type CurrentUserData } from "@/types";
import { currentUserHasScope } from "@utils/scopeUtils";
import { useGlobalMessage } from "@/components/providers/GlobalMessageProvider";
import { messageTemplates } from "@utils/messageTemplates";

export default function ClassesPage() {
	const navigate = useNavigate();
	const { userData, setUserData } = useUserData();
	const isMobileView = useMobileDetect();
	const { settings } = useSettings();

	const [modal, contextHolder] = Modal.useModal();
	const globalMessageAPI = useGlobalMessage();
	
	const showActionError = (err: unknown, fallback: string) => {
		const extractMessage = (value: unknown, depth = 0): string | undefined => {
			if (depth > 4 || value == null) return undefined;
			if (typeof value === "string") {
				try {
					return extractMessage(JSON.parse(value), depth + 1) || value;
				} catch {
					return value;
				}
			}
			if (typeof value !== "object") return undefined;
			const details = value as Record<string, unknown>;
			return extractMessage(details.message, depth + 1)
				|| extractMessage(details.detail, depth + 1)
				|| extractMessage(details.error, depth + 1);
		};
		const description = extractMessage(err) || fallback;
		if (!(err instanceof Error)) {
			globalMessageAPI.error(description);
		}
	};

	const [joinClassCode, setJoinClassCode] = useState<string>("");

	const [joinedClasses, setJoinedClasses] = useState<
		Array<{ id: number; name: string }>
	>([]);
	const [ownedClasses, setOwnedClasses] = useState<
		Array<{ id: number; name: string }>
	>([]);

	const [selectedClass, setSelectedClass] = useState<number | null>(null);

	const [createClassName, setCreateClassName] = useState<string>("");
	const canCreateClasses = currentUserHasScope(userData, 'global.class.create');
	const canDeleteClasses = currentUserHasScope(userData, 'global.class.delete');

	let cardStyle = { width: "350px", height: "230px" };
	if (isMobileView) {
		cardStyle = { width: "300px", height: "200px" };
	}

	const cardStyles: CardProps['styles'] = {
		root: getAppearAnimation(settings.accessibility.disableAnimations),
		title: {
			width: "100%",
			textAlign: "center",
		},
		body: {
			height: "calc(100% - 64px)",
		},
	}

	useEffect(() => {
		if (!userData) return;
		getClasses();
	}, [userData]);

	// Handle joining class from URL
	useEffect(() => {
		if(!userData) return;
		if (location.href.includes("joinClass")) {
			const urlParams = new URLSearchParams(window.location.search);
			const classCode = urlParams.get("code");
			if (classCode) {
				Log({ message: "Joining class from URL code", data: { classCode } });
				joinClassByCode(classCode);
			}
		}
	}, [userData]);

    function getClasses() {
        if (!userData) return;

        getAllUserClasses(String(userData.id))
            .then((classes) => {
                Log({ message: "Classes data", data: classes });
                const owned = classes.filter((cls: any) => cls.isOwner === true);
                const joined = classes.filter((cls: any) => cls.isOwner === false);
                setOwnedClasses(owned);
                setJoinedClasses(joined);
            })
            .catch((err) => {
                Log({
                    message: "Error fetching classes data",
                    data: err,
                    level: "error",
                });
                showActionError(err, "Failed to load your classes.");
            });
    }

    function deleteClass() {
		if(!canDeleteClasses) return;
        if (selectedClass === null) {
            Log({ message: "No class selected", level: "error" });
			globalMessageAPI.error(messageTemplates["class.selection.required.error"]);
            return;
        }
        Log({ message: "Selected class for deletion", data: { selectedClass } });

        modal.warning({
            title: "Are you sure you want to delete this class?",
            centered: true,
            content: 'This action is irreversible, and you will not be able to recover this class.',
            okCancel: true,
            onOk: () => {
                deleteClassAPI(selectedClass)
                .then(async (res) => {
                    if (!res.ok) {
                        const message = (res && (res.detail || res.message)) || "Failed to delete class.";
                        Log({ message: "Failed to delete class:", data: message, level: "error" });
                        showActionError(res, "Failed to delete class.");
                        return;
                    }
                    Log({message: "Class deleted:", data: res.data});
                    getClasses();
                    setSelectedClass(null);
                })
                .catch((err) => {
                    Log({ message: "Error deleting class:", data: err, level: "error" });
                    showActionError(err, "Failed to delete class.");
                })
            }
        })


    }

    function enterClassWithId(classId: number) {
        Log({ message: "Selected class (direct)", data: { classId } });
		if(classId === null) {
			Log({message: "No Class Selected", level: 'error'});
			globalMessageAPI.error(messageTemplates["class.selection.required.error"]);
			return;
		}
        joinClassSession(classId)
            .then((response) => {
                const { data } = response;
                Log({ message: "Entered class", data });
                if (response.success) {
                    getMe()
                        .then((userResponse) => {
                            const { data: userData } = userResponse;
                            Log({
                                message:
                                    "User data fetched successfully after joining class.",
                                data: userData,
                                level: "info",
                            });
                            setUserData(userData);
							const canAccessPanel = currentUserHasScope(userData, 'class.system.panel_access');
							if (canAccessPanel)
                                navigate("/panel");
                            else navigate("/student");
                        })
                        .catch((err) => {
                            Log({
                                message:
                                    "Error fetching user data after joining class:",
                                data: err,
                                level: "error",
                            });
                            showActionError(err, "Failed to load your account after entering the class.");
                        });
                } else {
                    showActionError(response, "Failed to enter class.");
                }
            })
            .catch((err) => {
                Log({
                    message: "Error entering class",
                    data: err,
                    level: "error",
                });
                showActionError(err, "Failed to enter class.");
            });
    }
	function createClass() {
		if(!canCreateClasses) return;
		if (createClassName.trim() === "") {
			Log({ message: "Class name cannot be empty", level: "error" });
			showActionError("Please enter a class name.", "Please enter a class name.");
			return;
		}
		createClassAPI({ name: createClassName })
			.then((response) => {
				const { data } = response;
				Log({ message: "Created class", data });
				if (response.success) {
					setOwnedClasses((prev) => [...prev, { id: data.classId, name: data.className }]);
					setCreateClassName("");
					enterClassWithId(data.classId);
				} else {
					showActionError(response, "Failed to create class.");
                }
			})
			.catch((err) => {
				Log({
					message: "Error creating class",
					data: err,
					level: "error",
				});
				showActionError(err, "Failed to create class.");
			});
	}

	function joinClassByCode(code: string) {
		if (code.trim() === "") {
			Log({ message: "Class code cannot be empty", level: "error" });
			showActionError("Please enter a class code.", "Please enter a class code.");
			return;
		}
		enrollInClass(code)
			.then((response) => {
				const { data } = response;
				Log({ message: "Joined class with code", data });
				if (response.success) {
                    setJoinClassCode("");
                    getClasses();
					setUserData(
						{
							...userData,
							activeClass: data.roomId,
						} as CurrentUserData
					);
					navigate("/student");
				} else {
					showActionError(response, "Failed to join class.");
                }
			})
			.catch((err) => {
				Log({
					message: "Error joining class with code",
					data: err,
					level: "error",
				});
				showActionError(err, "Failed to join class.");
			});
	}

	return (
		<>
			<FormbarHeader />
            {contextHolder}

			<Flex
				vertical
				align="center"
				justify="center"
				style={{ padding: "20px", height: "100%", width: "100%" }}
				gap={!isMobileView ? 50 : 30}
			>
				<div style={{ position: "static", textAlign: "center" }}>
					<Title level={isMobileView ? 3 : 1}>{!isMobileView ? "Manage Your " : ""}Classes</Title>
					<Text style={isMobileView ? {fontSize: 20} : {}}>
						Enter
						{canCreateClasses
							? ", create,"
							: ""}{" "}
						or join a class quickly
					</Text>
				</div>
				<Flex
					align="center"
					justify="center"
					gap={20}
					style={{ width: "100%" }}
					wrap="wrap"
				>
					<Card
						title="Enter a Class"
						style={{...cardStyle}}
						styles={cardStyles}
						loading={!userData}
					>
						<Flex
							vertical
							gap={20}
							align="center"
							justify="center"
							style={{ height: "100%" }}
						>
							<Select
								style={{ width: "100%", padding: "6px" }}
								placeholder="Select a class to enter"
								value={selectedClass}
								onChange={(value) => setSelectedClass(value)}
							>
								{ownedClasses.length > 0 && (
									<Select.OptGroup label="Owned Classes">
										{ownedClasses.length > 0 &&
											ownedClasses.map((cls) => (
												<Select.Option
													key={cls.id}
													value={cls.id}
												>
													{cls.name}
												</Select.Option>
											))}
									</Select.OptGroup>
								)}

								{joinedClasses.length > 0 && (
									<Select.OptGroup label="Joined Classes">
										{joinedClasses.length > 0 &&
											joinedClasses.map((cls) => (
												<Select.Option
													key={cls.id}
													value={cls.id}
												>
													{cls.name}
												</Select.Option>
											))}
									</Select.OptGroup>
								)}
							</Select>
							<Flex
								align="center"
								justify="center"
								gap={10}
								wrap="wrap"
								style={{ width: "100%" }}
							>
								<Button
									type="primary"
									onClick={() => enterClassWithId(selectedClass!)}
								>
									Enter{isMobileView ? "" : " Class"}
								</Button>
                                {
                                    userData && canDeleteClasses && (
                                        <Button
                                            type="default"
                                            color="danger"
                                            variant="solid"
                                            onClick={() => deleteClass()}
                                        >
                                            Delete{isMobileView ? "" : " Class"}
                                        </Button>
                                    )
                                }
							</Flex>
						</Flex>
					</Card>
					<Card
						title="Create a Class"
						style={{...cardStyle, animationDelay: '0.05s'}}
						styles={cardStyles}
						loading={
							!(
								userData &&
								canCreateClasses
							)
						}
						hidden={
							!(
								userData &&
								canCreateClasses
							)
						}
					>
						<Flex
							vertical
							gap={20}
							align="center"
							justify="center"
							style={{ height: "100%" }}
						>
							<Input
								style={{ width: "100%" }}
								placeholder="Class Name"
								value={createClassName}
								onChange={(e) =>
									setCreateClassName(e.target.value)
								}
							/>
							<Button
								type="primary"
								style={{ width: "100%" }}
								onClick={() => createClass()}
							>
								Create{isMobileView ? "" : " Class"}
							</Button>
						</Flex>
					</Card>
					<Card
						title="Join a Class"
						style={{...cardStyle, animationDelay: '0.1s'}}
						styles={cardStyles}
						loading={!userData}
					>
						<Flex
							vertical
							gap={20}
							align="center"
							justify="center"
							style={{ height: "100%" }}
						>
							<Input
								style={{ width: "100%" }}
								placeholder="Class Code"
								value={joinClassCode}
								onChange={(e) =>
									setJoinClassCode(e.target.value)
								}
							/>
							<Button
								type="primary"
								style={{ width: "100%" }}
								onClick={() => joinClassByCode(joinClassCode)}
							>
								Join{isMobileView ? "" : " Class"}
							</Button>
						</Flex>
					</Card>
				</Flex>
			</Flex>
		</>
	);
}
