"use client";

import { useParams } from "next/navigation";
import StudyRoomView from "@/components/study-room/StudyRoomView";

export default function StudyRoomPage() {
  const params = useParams();
  const roomId = params.roomId as string;

  return <StudyRoomView roomId={roomId} />;
}
