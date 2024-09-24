import { deleteEmailConfirmationToken, deleteResetPasswordToken, deleteUser, insertEmailConfirmToken, insertResetPasswordToken, insertUser, retrieveEmailConfirmationTokenFromToken, retrieveResetPasswordTokenFromToken, retrieveUserFromEmail, retrieveUserFromId, updateUser } from "../db/users";
import bcrypt from 'bcrypt';
import { IEmailConfirmToken, IResetPasswordToken, IUserDb, IUserInput, IUserOutput, string2Gender, string2SexualPref } from "../types/user";
import nodemailer from 'nodemailer';
import * as crypto from "node:crypto";
import moment from 'moment';


/*********************************************************
 * ================== USER MANAGEMENT ====================
 *********************************************************/

export async function createUser(rawUser: any) {

    const [hashedPassword, latitude, longitude] = await convertValues(rawUser);

    const user: IUserInput = {
        email: rawUser.email,
        emailVerified: false,
        username: rawUser.username,
        firstName: rawUser.firstName,
        lastName: rawUser.lastName,
        password: hashedPassword,
        gender: string2Gender(rawUser.gender),
        sexualPref: string2SexualPref(rawUser.sexualPref),
        biography: rawUser.biography,
        fameRate: 0,
        latitude: latitude,
        longitude: longitude,
        lastConnection: new Date(),
    };

    let id: number | null;

    try {
        id = await insertUser(user);
    } catch (error) {
        throw error;
    }

    if (id) {
        await sendVerificationEmail(id);
    } else {
        throw new Error();
    }
}

export async function getUser(id: number): Promise<IUserOutput | null> {
    const user: IUserOutput = await retrieveUserFromId(id);
    if (!user) {
        return null;
    }

    delete user['email'];
    delete user['emailVerified'];
    delete user['password'];
    delete user['createdAt'];

    return user;
}

export async function removeUser(id: number) {
    try {
        await deleteUser(id);
    } catch (error) {
        throw error;
    }
}

export async function patchUser(id: number, rawUser: any) {
    try {
        await updateUser(id, rawUser);
    } catch (error) {
        throw error;
    }
}

// Helpers

async function convertValues(rawUser: any): Promise<[string, number, number]> {
    const hashedPassword: string = await bcrypt.hash(rawUser.password, 10);
    let latitude: number;
    let longitude: number;

    if ('latitude' in rawUser) {
        latitude = parseFloat(rawUser.latitude);
        longitude = parseFloat(rawUser.longitude);
    } else {  // TODO: compute from IP ?
        latitude = 0;
        longitude = 0;
    }

    return [hashedPassword, latitude, longitude];
}

/*********************************************************
 * =========== EMAIL VERIFICATION MANAGEMENT =============
 *********************************************************/

export async function verifyEmail(token: string) {
    const emailConfirmToken: IEmailConfirmToken = await retrieveEmailConfirmationTokenFromToken(token);
    if (!emailConfirmToken || !emailConfirmToken.confirmToken) {
        throw new Error();
    }

    let hours = moment().diff(moment(emailConfirmToken.createdAt), 'hours');
    if (hours >= 24) {
        throw new Error();
    }

    updateUser(emailConfirmToken.user, {emailVerified: true});
    deleteEmailConfirmationToken(emailConfirmToken.id);
}

// Helpers

async function sendVerificationEmail(id: number) {

    const user: IUserDb = await retrieveUserFromId(id);
    const confirmToken: string = crypto.randomBytes(20).toString('hex');
    await insertEmailConfirmToken(id, confirmToken);

    const transporter = nodemailer.createTransport({
        host: process.env.MAILER_HOST,
        port: process.env.MAILER_PORT,
        secure: true,
        auth: {
            user: process.env.MAILER_LOGIN,
            pass: process.env.MAILER_PASSWORD,
        },
    });

    const info = await transporter.sendMail({
        from: '"Matcha!" <matcha@42l.fr>',
        to: user.email,
        subject: "Confirm your email!",
        text: "Confirm your email by using this link : http://localhost:3000/api/user/confirmemail/" + confirmToken,
        html: "<b>To confirm your email, click this <u><a href='http://localhost:3000/api/user/confirmemail/" + confirmToken + "'>link<a></u></b>",
    });

    console.log("Message sent: %s", info.messageId);
}

/*********************************************************
 * ============== PASSWORD RESET MANAGEMENT ==============
 *********************************************************/

export async function sendResetPasswordEmail(email: string) {
    const user: IUserDb = await retrieveUserFromEmail(email);
    if (!user)
        throw new Error();

    const resetPasswordToken: string = crypto.randomBytes(20).toString('hex');

    await insertResetPasswordToken(user.id, resetPasswordToken);

    const transporter = nodemailer.createTransport({
        host: process.env.MAILER_HOST,
        port: process.env.MAILER_PORT,
        secure: true,
        auth: {
            user: process.env.MAILER_LOGIN,
            pass: process.env.MAILER_PASSWORD,
        },
    });

    const info = await transporter.sendMail({
        from: '"Matcha!" <matcha@42l.fr>',
        to: user.email,
        subject: "Reset your password!",
        text: "Reset your password by using this link : http://localhost:3000/api/user/resetpassword/" + resetPasswordToken,
        html: "<b>To reset your password, click this <u><a href='http://localhost:3000/api/user/resetpassword/" + resetPasswordToken + "'>link<a></u></b>",
    });

    console.log("Message sent: %s", info.messageId);
}

export async function resetPassword(token: string, rawUser: any) {
    const resetPasswordToken: IResetPasswordToken = await retrieveResetPasswordTokenFromToken(token);
    if (!resetPasswordToken || !resetPasswordToken.resetToken) {
        throw new Error();
    }

    let hours = moment().diff(moment(resetPasswordToken.createdAt), 'hours');
    if (hours >= 24) {
        throw new Error();
    }

    const hashedPassword: string = await bcrypt.hash(rawUser.password, 10);

    updateUser(resetPasswordToken.user, {password: hashedPassword});
    deleteResetPasswordToken(resetPasswordToken.id);
}