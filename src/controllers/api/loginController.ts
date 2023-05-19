import { toLoginRequest } from "@/src/helpers/loginHelpers";
import { Account } from "@/src/models/loginModel";
import { createAccount, isCorrectPassword } from "@/src/services/loginService";
import { ILoginResponse } from "@/src/types/loginTypes";
import { DTLS, HUB, IRC, NRS, Nonce, groups, platformCDNs } from "@/static/fixed_responses/login_static";
import { RequestHandler } from "express";
import config from "../../../config.json";

// eslint-disable-next-line @typescript-eslint/no-misused-promises
const loginController: RequestHandler = async (request, response) => {
  const body = JSON.parse(request.body); // parse octet stream of json data to json object
  const loginRequest = toLoginRequest(body);
  // console.log(body);
  //console.log(String.fromCharCode.apiRouterly(null, req.body));

  const account = await Account.findOne({ email: loginRequest.email }); //{ _id: 0, __v: 0 }
  console.log("findone", account);

  if (!account && config.autoCreateAccount) {
    try {
      const newAccount = await createAccount({
        email: loginRequest.email,
        password: loginRequest.password,
        DisplayName: loginRequest.email.substring(0, loginRequest.email.indexOf("@")),
        CountryCode: loginRequest.lang.toUpperCase(),
        ClientType: loginRequest.ClientType,
        CrossPlatformAllowed: true,
        ForceLogoutVersion: 0,
        ConsentNeeded: false,
        TrackedSettings: []
      });
      console.log("CREATED ACCOUNT", newAccount);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { email, password, ...databaseAccount } = newAccount;
      const newLoginResponse: ILoginResponse = {
        ...databaseAccount,
        Groups: groups,
        platformCDNs: platformCDNs,
        Nonce: Nonce,
        NRS: NRS,
        DTLS: DTLS,
        IRC: IRC,
        HUB: HUB,
        BuildLabel: config.buildLabel,
        MatchmakingBuildId: config.matchmakingBuildId
      };

      console.log(newLoginResponse);
      response.json(newLoginResponse);
      return;
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error("error creating account");
      }
    }
  }

  //email not found or incorrect password
  if (!account || !isCorrectPassword(loginRequest.password, account.password)) {
    response.status(400).json({ error: "incorrect login data" });
    return;
  }

  const { email, password, ...databaseAccount } = account.toJSON();
  const newLoginResponse: ILoginResponse = {
    ...databaseAccount,
    Groups: groups,
    platformCDNs: platformCDNs,
    Nonce: Nonce,
    NRS: NRS,
    DTLS: DTLS,
    IRC: IRC,
    HUB: HUB,
    BuildLabel: config.buildLabel,
    MatchmakingBuildId: config.matchmakingBuildId
  };

  console.log("login response", newLoginResponse);
  response.json(newLoginResponse);
};

export { loginController };