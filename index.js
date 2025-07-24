// TAM FONKSİYONEL TICKET BOT (Discord.js v14)
// Otomatik mesaj + ilgilen + sil + transcript log

const {
  Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder,
  ButtonBuilder, ButtonStyle, PermissionsBitField,
  Partials, ChannelType
} = require('discord.js');
const fs = require('fs');
const { joinVoiceChannel } = require('@discordjs/voice');
//const config = require('./config.json');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates // Ses kanalı bağlanması için gerekli
  ],
  partials: [Partials.Channel, Partials.Message]
});

// 🔧 Ayarlar
const CATEGORY_ID = '1159883120250728590'; // Kategori ID
const LOG_CHANNEL_ID = '1332013480588480633'; // LOG kanal ID
const ALLOWED_ROLE_IDS = ['1276628206618677380', '1276893418387406898', '1277289157802328104', '1276885280858701897']; // Yetkili roller
const VOICE_CHANNEL_ID = '1334267507086852167'; // Botun sürekli kalacağı ses kanalı ID'si

const ticketTypes = {
  genel_destek: { prefix: '🎫', name: 'Genel Destek' },
  uptime_destek: { prefix: '🎙️', name: 'Streamer Destek' },
  bug_hata: { prefix: '💥', name: 'Yetkili Şikayeti' },
  reklam_sponsorluk: { prefix: '💸', name: 'Reklam/Sponsorluk' }
};

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;
  const { guild, user, customId } = interaction;

  // === ILGILEN / KAPAT ===
  if (customId === 'ilgilen' || customId === 'kapat') {
    const member = await guild.members.fetch(user.id);
    if (!ALLOWED_ROLE_IDS.some(rid => member.roles.cache.has(rid))) {
      return interaction.reply({ content: '❌ Bu butonu kullanma yetkin yok.', ephemeral: true });
    }

    const opener = interaction.channel.topic;

    if (customId === 'ilgilen') {
      return interaction.reply({
        content: `**<@${opener}> Destek Talebin ile <@${user.id}> adlı yetkilimiz ilgileniyor.**`
      });
    }

    if (customId === 'kapat') {
      const messages = await interaction.channel.messages.fetch({ limit: 100 });
      const sorted = messages.sort((a, b) => a.createdTimestamp - b.createdTimestamp);

      const logContent = sorted.map(m => {
        const timestamp = new Date(m.createdTimestamp).toLocaleString();
        return `[${timestamp}] ${m.author.tag}: ${m.content}`;
      }).join('\n');

      const fileName = `transcript-${interaction.channel.id}.txt`;
      fs.writeFileSync(fileName, logContent);

      const logEmbed = new EmbedBuilder()
        .setTitle('🎫 Ticket Kapatıldı')
        .addFields(
          { name: 'Açan Kullanıcı', value: `<@${opener}>`, inline: true },
          { name: 'Kapatan Yetkili', value: `<@${user.id}>`, inline: true },
          { name: 'Kanal', value: `#${interaction.channel.name}`, inline: false }
        )
        .setColor('Red')
        .setTimestamp();

      const logChannel = guild.channels.cache.get(LOG_CHANNEL_ID);
      if (logChannel) {
        await logChannel.send({
          content: `📁 **Ticket Transcript:**`,
          embeds: [logEmbed],
          files: [fileName]
        });
      }

      fs.unlinkSync(fileName); // Transcript dosyasını sil
      await interaction.channel.delete();
    }

    return;
  }

  // === TICKET OLUSTUR ===
  const ticketInfo = ticketTypes[customId];
  if (!ticketInfo) return;

  const channelName = `${ticketInfo.prefix}・${user.username}`.toLowerCase();
  if (guild.channels.cache.find(c => c.name === channelName)) {
    return interaction.reply({ content: `❌ Zaten bir destek kanalın var.`, ephemeral: true });
  }

  try {
    const channel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: CATEGORY_ID,
      topic: user.id,
      permissionOverwrites: [
        {
          id: guild.roles.everyone,
          deny: [PermissionsBitField.Flags.ViewChannel]
        },
        {
          id: user.id,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.AttachFiles,
            PermissionsBitField.Flags.ReadMessageHistory
          ]
        },
        ...ALLOWED_ROLE_IDS.map(id => ({
          id,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.AttachFiles,
            PermissionsBitField.Flags.ReadMessageHistory
          ]
        }))
      ]
    });

    await interaction.reply({ content: `✅ Ticket oluşturuldu: <#${channel.id}>`, ephemeral: true });

    const embed = new EmbedBuilder()
      .setTitle('🎫 ᛠ Oblivora Destek Sistemi')
      .setDescription(
        `**Merhaba <@${user.id}>, Oblivora destek sistemine hoş geldiniz. Lütfen sorununuzu kısa bir cümle ile özetleyiniz.**\n\n` +
        `> Destek Kategorisi: \`${ticketInfo.name}\`\n` +
        `> Talep ile ilgilenecek ekip: ${ALLOWED_ROLE_IDS.map(id => `<@&${id}>`).join(', ')}`
      )
      .setColor('Purple');

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('ilgilen')
        .setLabel('👋・İlgilen')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('kapat')
        .setLabel('🗑️・Talebi Sonlandır')
        .setStyle(ButtonStyle.Danger)
    );

    await channel.send({ embeds: [embed], components: [row] });

  } catch (err) {
    console.error(err);
    await interaction.reply({ content: '❌ Kanal oluşturulamadı.', ephemeral: true });
  }
});

client.once('ready', async () => {
  console.log(`✅ Bot aktif: ${client.user.tag}`);

  const channel = await client.channels.fetch(VOICE_CHANNEL_ID).catch(console.error);
  if (channel && channel.isVoiceBased()) {
    try {
      joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator,
        selfDeaf: false
      });

      console.log(`🔊 Bot ses kanalına katıldı: ${channel.name}`);
    } catch (err) {
      console.error('❌ Ses kanalına katılamadı:', err);
    }
  } else {
    console.error('❌ Ses kanalı bulunamadı veya geçerli değil.');
  }
});


client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith('!ticketkur')) return;

  // Sadece yetkililer kullanabilsin
  if (!message.member.roles.cache.some(r => ALLOWED_ROLE_IDS.includes(r.id))) {
    return message.reply('❌ Bu komutu kullanmak için yetkin yok.');
  }

  const embed = new EmbedBuilder()
    .setTitle('ᛠ Oblivora Canlı Destek')
    .setDescription(
      `Merhaba, Oblivora canlı destek sistemine hoş geldiniz.\n\n` +
      `Destek talebi oluşturmak için aşağıdaki butonlardan size uygun seçeneği seçebilirsiniz. Destek talebi oluşturduğunuz zaman bir yetkilimiz en kısa sürede sizinle ilgilenecektir.`
    )
    .setColor('Purple');

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('genel_destek')
      .setLabel('Genel Destek')
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId('uptime_destek')
      .setLabel('Streamer Destek')
      .setStyle(ButtonStyle.Success),

    new ButtonBuilder()
      .setCustomId('bug_hata')
      .setLabel('Yetkili Şikayeti')
      .setStyle(ButtonStyle.Danger),

    new ButtonBuilder()
      .setCustomId('reklam_sponsorluk')
      .setLabel('Reklam/Sponsorluk')
      .setStyle(ButtonStyle.Secondary)
  );

  await message.channel.send({ embeds: [embed], components: [row] });
});

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('<h1>Bot aktif</h1>');
});

app.listen(PORT, () => {
  console.log(`🌐 Web sunucu çalışıyor, port: ${PORT}`);
});

client.login(process.env.TOKEN);
