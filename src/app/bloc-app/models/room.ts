import { RoomUser } from "./room-user";

export interface Room {
  users: RoomUser[]
  roomId: string;
}
