import type { IUserOutput } from "./user"


export enum Notif_t_E {
    MSG = "MSG",
    MATCH = "MATCH",
    VISIT = "VISIT",
    LIKE = "LIKE",
    UNLIKE = "UNLIKE",
    EVENT = "EVENT",
    REMOVEEVENT = "REMOVEEVENT"
}

export type Notif_T = {
    id: number,
    type: Notif_t_E,
    /**
     * The user who liked/visited/sent a msg etc
     */
    involvedUser: IUserOutput,
    date: Date,
    payload: any
}

// Helpers

export function string2Notif_t_E(notifTypeString: string): Notif_t_E {
    switch (notifTypeString) {
        case "MSG":
            return Notif_t_E.MSG;
        case "MATCH":
            return Notif_t_E.MATCH;
        case "VISIT":
            return Notif_t_E.VISIT;
        case "LIKE":
            return Notif_t_E.LIKE;
        case "UNLIKE":
            return Notif_t_E.UNLIKE;
        case "EVENT":
            return Notif_t_E.EVENT;
        case "REMOVEEVENT":
            return Notif_t_E.REMOVEEVENT;
        default:
            throw new TypeError;
    }
}