const { Server } = require("socket.io");
const logger = require("./logger");
const db = require("./public/function/db");

const io = new Server();

io.of("/chat").on("connection", async (socket) => {
  console.log(`${socket.uid}가 들어왔습니다.`);
  logger.info(`"${socket.uid}"가 들어왔습니다.`);

  socket.on("chat", async (msg) => {
    try {
      const rows = await db(`INSERT INTO message
    (m_rnum, m_uid, m_content) VALUES
    ("${msg.rnum}","${msg.uid}","${msg.content}")`);
      socket.to(msg.rnum).emit("chat", msg.content);
      logger.info(
        `socket.js CHAT "${msg.rnum}", "${msg.uid}" : "${msg.content}" `
      );
    } catch (error) {
      logger.error(
        `서버에러 socket.js CHAT "${msg.rnum}", "${msg.uid}" : "${msg.content}" `
      );
    }
  });
  socket.on("join", async (v1) => {
    logger.info(`join "${JSON.stringify(v1)}"`);
    console.log(v1);
    socket.join(v1.rnum);
    socket.to(v1.rnum).emit("clientJoin", `${v1.uid}`);
    try {
      const rows = await db(`
      SELECT r_uid FROM room WHERE r_uid = "${v1.uid}"
      `);
      if (rows.length > 0) {
        console.log("이미 참여되어있습니다.");
        logger.info(
          `socket.js 이미 참여 되어있습니다. JOIN u : "${v1.uid}" r : "${v1.rnum}"`
        );
      } else {
        const rows2 = await db(`
      INSERT room (r_num, r_uid) VALUES ("${v1.rnum}", "${v1.uid}")
      `);
        logger.info(`socket.js JOIN u : "${v1.uid}" r : "${v1.rnum}"`);
      }
    } catch (error) {
      logger.error(`서버에러 socket.js JOIN u : "${v1.uid}" r : "${v1.rnum}"`);
    }
  });
  socket.on("leave", async (v1) => {
    logger.info(`leave "${v1}"`);
    socket.to(v1.rnum).emit("clientLeave", `${v1.uid}`);
    socket.leave(v1.rnum);
    try {
      const rows = await db(`
      DELETE FROM room WHERE r_num="${v1.rnum}"
      AND r_uid="${v1.uid}"
      `);
      logger.info(`socket.js LEAVE u : "${v1.uid}" r : "${v1.rnum}"`);
    } catch (error) {
      logger.error(`서버에러 socket.js LEAVE u : "${v1.uid}" r : "${v1.rnum}"`);
    }
  });
});

module.exports = io;
