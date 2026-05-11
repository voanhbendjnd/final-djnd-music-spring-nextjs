import {getServerSession} from "next-auth";
import {authOptions} from "@/app/api/auth/[...nextauth]/route";
import AuthSignIn from "@/components/auth/auth.signin";
import {redirect} from "next/navigation";

const SignInPage = async ()=>{
    const session = await getServerSession(authOptions);
    if(session){
        redirect("/");
    }
    else{
      return  <AuthSignIn/>
    }
}

export default SignInPage;