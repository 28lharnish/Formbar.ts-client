import { getUser } from "@/api/userApi";
import { useUserData } from "@/main";
import { Card } from "antd";
import { useEffect, useState } from "react";


export default function ProfileViewingCard({
	userId
}:{userId:string}) {
	const { userData } = useUserData();
	const [userName, setUserName] = useState<string>("");
	
	useEffect(() => {
		if(!userData || userId == '') return;

		getUser(userId)
			.then(({data}) => {
				setUserName(data.displayName);
			})
	}, [userData, userId])

	if(userData && String(userData.id) == userId) return <></>;

	return (
		<Card title={`Viewing ${userName}'s profile`} style={{ position: 'absolute', top: 80, left: 16 }} />
	)
}