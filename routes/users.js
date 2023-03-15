const express = require("express");
const router = express.Router();
const db = require("../public/function/db");
const { sendMail, randomNumber } = require("../public/function/mail");
const { encrypt } = require("../public/function/encrypt");
const logger = require("../logger");

//인증메일 발송
router.post("/auth", async (req, res) => {
  const { email } = req.body;
  const rnd = randomNumber();
  if (!email) {
    logger.error(`값이 없음`);
    return res.status(400).json({
      status: "fail",
      message: "need check data",
    });
  }
  try {
    const rows = await db(
      `SELECT u_email FROM user WHERE u_email = "${email}"`
    );
    if (rows.length > 0) {
      logger.info(
        `/users/auth POST "${email}" 이미 가입되어있는 이메일 입니다.`
      );
      return res.status(200).json({
        status: "fail",
        message: "already have email",
        info: {
          email: rows[0].u_email,
        },
      });
    } else {
      const rows2 = await db(`
      INSERT INTO auth (a_email, a_digit) VALUES ("${email}", "${rnd}")
      `);
      sendMail(email, rnd);
      logger.info(`/users/auth POST "${email}" 로 인증번호를 보내었습니다.`);
      return res.status(201).json({
        status: "success",
        message: "send mail, digit saved.",
        info: {
          email: email,
          digit: rnd,
        },
      });
    }
  } catch (error) {
    logger.error(
      `/users/auth POST 서버에러 "${email}" 로 인증번호를 보내는데 실패하였습니다.`
    );
    res.status(500).json({
      status: "fail",
      message: "auth mail send fail",
    });
  }
});

//인증번호 일치확인
router.get("/auth_check", async (req, res) => {
  const { email, digit } = req.query;
  if (!email || !digit) {
    logger.error(`값이 없음`);
    return res.status(400).json({
      status: "fail",
      message: "need check data",
    });
  }
  try {
    const rows = await db(`
    SELECT a_id, a_digit FROM auth WHERE a_email = "${email}" AND a_used = 0 ORDER BY a_id DESC LIMIT 1
    `);
    if (rows.length < 1) {
      logger.error(`/users/auth_check GET "${email}" 결과값이 없음`);
      return res.status(500).json({
        status: "fail",
        message: "result empty",
      });
    } else if (digit.toString() === rows[0].a_digit.toString()) {
      const rows2 = await db(`
      UPDATE auth SET a_used = 1 WHERE a_id = ${rows[0].a_id}
      `);
      logger.info(`/users/auth_check GET "${email}" 인증번호 일치`);
      return res.status(200).json({
        status: "success",
        message: "check complete.",
      });
    } else {
      throw new Error();
    }
  } catch (error) {
    logger.error(`/users/auth_check GET "${email}" 서버에러 인증실패`);
    return res.status(500).json({
      status: "fail",
      message: "match fail",
    });
  }
});

//가입
router.post("/sign", async (req, res) => {
  const { email, pwd, name, nick } = req.body;
  const encryptPwd = encrypt(pwd);
  if (!email || !pwd || !name || !nick) {
    logger.error(`값이 없음`);
    return res.status(400).json({
      status: "fail",
      message: "need check data",
    });
  }
  try {
    const rows = await db(`
    SELECT u_id, u_email FROM user WHERE u_email = "${email}"
    `);
    if (rows.length > 0) {
      logger.info(
        `/users/sign POST "${email}" 이미 가입되어있는 이메일 입니다.`
      );
      return res.status(200).json({
        status: "fail",
        message: "already have email",
        info: {
          uid: rows[0].u_id,
          email: email,
        },
      });
    } else {
      const rows2 = await db(`
      INSERT INTO user (u_email, u_pwd, u_name, u_nick) VALUES ("${email}","${encryptPwd}","${name}","${nick}")
      `);
      logger.info(`/users/sign POST "${email}"로 가입성공 하였습니다.`);
      return res.status(200).json({
        status: "success",
        message: "sign complete",
        info: {
          uid: rows2.insertId,
          email: email,
          pwd: pwd,
          name: name,
          nick: nick,
        },
      });
    }
  } catch (error) {
    logger.error(`/users/sign POST 서버에러 "${email}" 가입실패`);
    return res.status(500).json({
      status: "fail",
      message: "sign fail",
    });
  }
});

//로그인
router.post("/login", async (req, res) => {
  const { email, pwd } = req.body;
  const encryptPwd = encrypt(pwd);
  if (!email || !pwd) {
    logger.error(`값이 없음`);
    return res.status(400).json({
      status: "fail",
      message: "need check data",
    });
  }

  try {
    const rows = await db(`
    SELECT 
    u_id,
    u_email,
    u_pwd,
    u_name,
    u_nick
    FROM user WHERE u_email = "${email}"
    `);
    if (rows.length > 0) {
      if (rows[0].u_pwd === encryptPwd) {
        logger.info(`/users/login POST "${email}"사용자 로그인`);
        return res.status(200).json({
          status: "success",
          message: "login success",
          info: {
            uid: rows[0].u_id,
            email: rows[0].u_email,
            name: rows[0].u_name,
            nick: rows[0].u_nick,
          },
        });
      } else {
        logger.info(`/users/login POST "${email}"사용자 비밀번호 불일치`);
        return res.status(200).json({
          status: "fail",
          message: "not match pwd",
        });
      }
    } else {
      logger.info(`/users/login POST "${email}"사용자 비밀번호 미입력`);
      return res.status(200).json({
        status: "fail",
        message: "no pwd",
      });
    }
  } catch (error) {
    logger.error(`/users/login POST 서버에러 "${email}"사용자 로그인실패`);
    return res.status(500).json({
      status: "fail",
      message: "login fail",
    });
  }
});

module.exports = router;
