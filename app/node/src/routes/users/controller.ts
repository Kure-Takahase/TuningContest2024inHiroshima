import express from "express";
import { execSync } from "child_process";
import { getUsers } from "./repository";
import { getUserByUserId } from "./repository";
import { getFileByFileId } from "../files/repository";
import { SearchedUser, Target, User } from "../../model/types";
import { getUsersByKeyword } from "./usecase";

export const usersRouter = express.Router();

// ユーザーアイコン画像取得API
usersRouter.get(
  "/user-icon/:userIconId",
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    //let random = Math.floor(Math.random() * 10000) + 1;
    //var randomStr = random.toString()
    //console.time("userIconIdTotal_"+req.params.userIconId+"_"+randomStr);
    const userIconId: string = req.params.userIconId;

    try {
      var userIconkeyStr = "userIcon_"+userIconId
      var userIconkeyDataStr = "userIconData_"+userIconId
      const redis = require('redis');
      const client = redis.createClient({
        url: 'redis://my-redis:6379',
      });
      client.connect()
      const value = await client.get(userIconkeyStr);
      if(value == null)
      {
        //console.time("userIconIdQuery_"+req.params.userIconId+"_"+randomStr);
        const userIcon = await getFileByFileId(userIconId);
        //console.timeEnd("userIconIdQuery_"+req.params.userIconId+"_"+randomStr);
        if (!userIcon) {
          res.status(404).json({
            message:
              "指定されたユーザーアイコンIDのユーザーアイコン画像が見つかりません。",
          });
          console.warn("specified user icon not found");
          return;
        }
        const path = userIcon.path;
        // 500px x 500pxでリサイズ
        const data = execSync(`convert ${path} -resize 500x500! PNG:-`, {
          shell: "/bin/bash",
        });
        var base64Str = data.toString("base64")
        res.status(200).json({
          fileName: userIcon.fileName,
          data: base64Str,
        });
        //console.log("successfully get user icon");


        var jsonStr = JSON.stringify(userIcon);
        await client.set(userIconkeyStr, jsonStr);
        await client.set(userIconkeyDataStr, base64Str);
        await client.set("fileID_"+userIconId, userIcon.fileName);

      }
      else
      {
        const userIconObj = JSON.parse(value);
        var data64Str = await client.get(userIconkeyDataStr);
        res.status(200).json({
          fileName: userIconObj.fileName,
          data: data64Str,
        });
      }
      client.disconnect()



    } catch (e) {
      next(e);
    }
    //console.timeEnd("userIconIdTotal_"+req.params.userIconId+"_"+randomStr);
  }
);

// ユーザー一覧取得API
usersRouter.get(
  "/",
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    //let random = Math.floor(Math.random() * 10000) + 1;
    //var randomStr = random.toString()
    //console.time("usersTotal"+randomStr);
    let limit = Math.trunc(Number(req.query.limit));
    if (Number.isNaN(limit) || limit < 0 || 100 < limit) {
      limit = 20;
    }

    let offset = Math.trunc(Number(req.query.offset));
    if (Number.isNaN(offset) || offset < 0) {
      offset = 0;
    }

    try {
      var limitStr = limit.toString()
      var offserStr = offset.toString()
      //console.log(limitStr+"_"+offserStr)
      var keyStr = "users_"+limitStr+"_"+offserStr

      const redis = require('redis');
      const client = redis.createClient({
        url: 'redis://my-redis:6379',
      });
      client.connect()
      const value = await client.get(keyStr);
      if(value == null)
      {
        //console.time("usersQuery"+randomStr);
        const users = await getUsers(limit, offset);
        //console.timeEnd("usersQuery"+randomStr);
        res.status(200).json(users);
        //console.log("successfully get users list");
        var jsonStr = JSON.stringify(users);
        await client.set(keyStr, jsonStr);

      }
      else
      {
        res.status(200).send(value);
      }
      client.disconnect()

    } catch (e) {
      next(e);
    }
    //console.timeEnd("usersTotal"+randomStr);
  }
);

// ユーザー検索API
usersRouter.get(
  "/search",
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    //let random = Math.floor(Math.random() * 10000) + 1;
    //var randomStr = random.toString()
    //console.time("searchTotal"+randomStr);
    const keyword = req.query.q;
    if (typeof keyword !== "string") {
      if (!keyword) {
        res.status(400).json({ message: "検索キーワードを指定してください。" });
        console.warn("keyword not specified");
        return;
      }
      res
        .status(400)
        .json({ message: "検索キーワードは1つのみ指定してください。" });
      console.warn("multiple keyword specified");
      return;
    }
    if (keyword.length < 2 || 50 < keyword.length) {
      res.status(400).json({
        message: "検索キーワードは2文字以上50文字以下で指定してください。",
      });
      console.warn("specified keyword length too short or long");
      return;
    }

    let targets: string[] = [];
    if (typeof req.query.target === "string") {
      targets.push(req.query.target as string);
    } else if (Array.isArray(req.query.target)) {
      targets = req.query.target as string[];
    } else {
      targets = [
        "userName",
        "kana",
        "mail",
        "department",
        "role",
        "office",
        "skill",
        "goal",
      ];
    }
    if (!isValidTarget(targets)) {
      res.status(400).json({ message: "不正なtargetが指定されています。" });
      console.warn("invalid target specified");
      return;
    }

    let limit = Math.trunc(Number(req.query.limit));
    if (Number.isNaN(limit) || limit < 0 || 100 < limit) {
      limit = 20;
    }

    let offset = Math.trunc(Number(req.query.offset));
    console.log("offset start")
    console.log(offset)
    console.log("offset :",offset)
    if (Number.isNaN(offset) || offset < 0) {
      offset = 0;
    }
    try {
      const duplicateUsers = await getUsersByKeyword(
        keyword,
        targets as Target[]
      );
      if (duplicateUsers.length === 0) {
        res.json([]);
        //console.log("no user found");
        return;
      }

      // 入社日・よみがなの昇順でソート
      duplicateUsers.sort((a, b) => {
        if (a.entryDate < b.entryDate) return -1;
        if (a.entryDate > b.entryDate) return 1;
        if (a.kana < b.kana) return -1;
        if (a.kana > b.kana) return 1;
        return 0;
      });

      // 重複ユーザーを削除
      let uniqueUsers: SearchedUser[] = [];
      duplicateUsers.forEach((user) => {
        if (
          !uniqueUsers.some((uniqueUser) => uniqueUser.userId === user.userId)
        ) {
          uniqueUsers = uniqueUsers.concat(user);
        }
      });

      // User型に変換
      const users: User[] = uniqueUsers
        .slice(offset, offset + limit)
        .map((user) => {
          return {
            userId: user.userId,
            userName: user.userName,
            userIcon: {
              fileId: user.userIcon.fileId,
              fileName: user.userIcon.fileName,
            },
            officeName: user.officeName,
          };
        });
      res.json(users);
      //console.log(`successfully searched ${users.length} users`);
      
    } catch (e) {
      next(e);
    }
    //console.timeEnd("searchTotal"+randomStr);
  }
);

const isValidTarget = (targets: string[]): boolean => {
  const validTargets: Target[] = [
    "userName",
    "kana",
    "mail",
    "department",
    "role",
    "office",
    "skill",
    "goal",
  ];

  return targets.every((target) => validTargets.includes(target as Target));
};

// ログインユーザー取得API
usersRouter.get(
  "/login-user",
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    try {
      const userId = req.headers["X-DA-USER-ID"] as string;

      const user = await getUserByUserId(userId);
      if (!user) {
        res.status(404).json({ message: "ユーザーが見つかりませんでした。" });
        console.warn("session user is not found");
        return;
      }
      res.status(200).json(user);

    } catch (e) {
      next(e);
    }
  }
);
