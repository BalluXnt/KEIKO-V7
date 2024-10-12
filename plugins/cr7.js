import axios from 'axios'
let handler = async(m, { conn, usedPrefix, command }) => {
let res = (await axios.get(`https://raw.githubusercontent.com/Guru322/api/Guru/BOT-JSON/CristianoRonaldo.json`)).data  
let url = await res[Math.floor(res.length * Math.random())]
//conn.sendFile(m.chat, url, 'error.jpg', `*RONALDO*`, m)}
conn.sendButton(m.chat, "*RONALDO*", author, url, [['⚽ NEXT ⚽', `${usedPrefix + command}`]], m)}
handler.help = ['cristianoronaldo', 'cr7']
handler.tags = ['internet']
handler.command = /^(ronaldo|cr7)$/i
export default handler
