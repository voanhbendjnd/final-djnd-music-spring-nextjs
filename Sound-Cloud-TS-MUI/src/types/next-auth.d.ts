import NextAuth, {DefaultSession} from 'next-auth';
import {JWT} from "next-auth/jwt"
interface IUser{
    id: string;
    email: string;
    name: string;
    role: string;
    avatar: string;
    type:string;
    username: string;
}
declare module "next-auth/jwt"{
    interface JWT{
        access_token:string;
        refresh_token:string;
        access_expire:number;
        error?:string;
        user: IUser;

    }
}
declare module "next-auth"{
    interface Session{
        access_token:string;
        refresh_token:string;
        expires_in:number;
        error?:string;
        user: IUser;
    }

}