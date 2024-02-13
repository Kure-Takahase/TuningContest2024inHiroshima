import { Target, SearchedUser } from "../../model/types";
import {
  getUsersByUserName,
  getUsersByKana,
  getUsersByMail,
  getUsersByDepartmentName,
  getUsersByRoleName,
  getUsersByOfficeName,
  getUsersBySkillName,
  getUsersByGoal,
} from "./repository";

export const getUsersByKeyword = async (
  keyword: string,
  targets: Target[]
): Promise<SearchedUser[]> => {
  let users: SearchedUser[] = [];

  let random = Math.floor(Math.random() * 100000) + 1;
  var randomStr = random.toString()

  const redis = require('redis');
  const client = redis.createClient({
    url: 'redis://my-redis:6379',
  });
  client.connect()
  for (const target of targets) {
    //const oldLen = users.length
    var keyStr =  "keywordUsers_" + target + "_" + keyword
    const value = await client.get(keyStr);
    if(value == null)
    {
      console.time("Keyword_"+target+ "_" + keyword+"_"+randomStr);
      switch (target) {
      case "userName":
        const userSingle = await getUsersByUserName(keyword)
        users = users.concat(userSingle)
        var jsonStr = JSON.stringify(userSingle);
        await client.set(keyStr, jsonStr);
        break;
      case "kana":
        const userSingle = await getUsersByKana(keyword)
        users = users.concat(userSingle)
        var jsonStr = JSON.stringify(userSingle);
        await client.set(keyStr, jsonStr);
        break;
      case "mail":
        const userSingle = await getUsersByMail(keyword)
        users = users.concat(userSingle)
        var jsonStr = JSON.stringify(userSingle);
        await client.set(keyStr, jsonStr);
        break;
      case "department":
        const userSingle = await getUsersByDepartmentName(keyword)
        users = users.concat(userSingle)
        var jsonStr = JSON.stringify(userSingle);
        await client.set(keyStr, jsonStr);
        break;
      case "role":
        const userSingle = await getUsersByRoleName(keyword)
        users = users.concat(userSingle)
        var jsonStr = JSON.stringify(userSingle);
        await client.set(keyStr, jsonStr);
        break;
      case "office":
        const userSingle = await getUsersByOfficeName(keyword)
        users = users.concat(userSingle)
        var jsonStr = JSON.stringify(userSingle);
        await client.set(keyStr, jsonStr);
        break;
      case "skill":
        const userSingle = await getUsersBySkillName(keyword)
        users = users.concat(userSingle)
        var jsonStr = JSON.stringify(userSingle);
        await client.set(keyStr, jsonStr);
        break;
      case "goal":
        const userSingle = await getUsersByGoal(keyword)
        users = users.concat(userSingle)
        var jsonStr = JSON.stringify(userSingle);
        await client.set(keyStr, jsonStr);
        break;
      }
      console.timeEnd("Keyword_"+target+ "_" + keyword+"_"+randomStr);
    }
    else
    {
      //console.log("Keyword Hit");
      const userSingle = JSON.parse(value);
      users = users.concat(userSingle)
    }
    //console.log(`${users.length - oldLen} users found by ${target}`);
  }
  client.disconnect()
  return users;
};
