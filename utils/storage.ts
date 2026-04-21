import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = {
  token: "auth_token",
  loginTime: "login_time",
  orgId: "org_id",
  orgName: "org_name",
};

export async function getToken() {
  return (await AsyncStorage.getItem(KEY.token)) || "";
}

export async function getLoginTime() {
  const time = await AsyncStorage.getItem(KEY.loginTime);
  return time ? parseInt(time, 10) : 0;
}

export async function setToken(token: string) {
  await AsyncStorage.setItem(KEY.token, token);
  await AsyncStorage.setItem(KEY.loginTime, Date.now().toString());
}

export async function clearToken() {
  await AsyncStorage.multiRemove([KEY.token, KEY.loginTime]);
}

export async function setOrg(idOrOrg: string | { id: string, name: string }, name?: string) {
  if (typeof idOrOrg === 'object') {
    await AsyncStorage.setItem(KEY.orgId, idOrOrg.id);
    await AsyncStorage.setItem(KEY.orgName, idOrOrg.name);
  } else {
    await AsyncStorage.setItem(KEY.orgId, idOrOrg);
    if (name) await AsyncStorage.setItem(KEY.orgName, name || "");
  }
}

export async function getOrg() {
  const id = await AsyncStorage.getItem(KEY.orgId);
  const name = await AsyncStorage.getItem(KEY.orgName);

  if (!id) return null;

  return {
    id,
    name: name || "Org",
  };
}

export async function clearOrg() {
  await AsyncStorage.multiRemove([KEY.orgId, KEY.orgName]);
}