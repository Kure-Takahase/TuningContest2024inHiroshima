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
      console.time("Keyword_"+target+"_"+randomStr);
      switch (target) {
      case "userName":
        users = users.concat(await getUsersByUserName(keyword));
        break;
      case "kana":
        users = users.concat(await getUsersByKana(keyword));
        break;
      case "mail":
        users = users.concat(await getUsersByMail(keyword));
        break;
      case "department":
        users = users.concat(await getUsersByDepartmentName(keyword));
        break;
      case "role":
        users = users.concat(await getUsersByRoleName(keyword));
        break;
      case "office":
        users = users.concat(await getUsersByOfficeName(keyword));
        break;
      case "skill":
        users = users.concat(await getUsersBySkillName(keyword));
        break;
      case "goal":
        users = users.concat(await getUsersByGoal(keyword));
        break;
      }
      var jsonStr = JSON.stringify(users);
      await client.set(keyStr, jsonStr);
      console.timeEnd("Keyword_"+target+"_"+randomStr);
    }
    else
    {
      console.log("Keyword Hit");
      users = JSON.parse(value);
    }
    //console.log(`${users.length - oldLen} users found by ${target}`);
  }
  client.disconnect()
  return users;
};
