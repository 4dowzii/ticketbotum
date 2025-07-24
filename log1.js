// log.js
const fs = require('fs');
const { EmbedBuilder } = require('discord.js');

// 🔧 BURAYA LOG KANAL ID'Nİ GİR
const LOG_CHANNEL_ID = '1332013480588480633';

async function logTicketClose(channel, openerId, closerId) {
  try {
    const messages = await channel.messages.fetch({ limit: 100 });
    const sorted = messages.sort((a, b) => a.createdTimestamp - b.createdTimestamp);

    const logContent = sorted.map(msg =>
      `${msg.author.tag} (${msg.createdAt.toISOString()}): ${msg.content}`
    ).join('\n');

    const fileName = `transcript-${channel.id}.txt`;
    fs.writeFileSync(fileName, logContent);

    const logEmbed = new EmbedBuilder()
      .setTitle('📄 Ticket Transcript')
      .addFields(
        { name: '🎫 Açan Kişi', value: `<@${openerId}>`, inline: true },
        { name: '🛠️ Kapatan Yetkili', value: `<@${closerId}>`, inline: true },
        { name: '📝 Kanal Adı', value: `${channel.name}`, inline: false }
      )
      .setColor('Blurple')
      .setTimestamp();

    const logChannel = channel.guild.channels.cache.get(LOG_CHANNEL_ID);
    console.log('Log kanal:', logChannel ? 'Bulundu' : 'YOK'); // Burada logChannel durumunu görebilirsin

    if (logChannel) {
      await logChannel.send({
        content: `🎫 **Bir ticket kapatıldı!**`,
        embeds: [logEmbed],
        files: [fileName]
      });
    }

    fs.unlinkSync(fileName); // işlem sonrası dosyayı sil
  } catch (err) {
    console.error('Log sistemi hatası:', err);
  }
}

module.exports = { logTicketClose };
