const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

module.exports = {
  name: 'ticketkur',
  description: 'Canlı destek sistemi embedini kurar',
  async execute(message) {
    // Sadece belirli roller kullanabilsin (örnek: 'Yönetici' ve 'Destek Ekibi' rolleri)
    const allowedRoles = ['Founder', 'Destek Ekibi'];
    if (!message.member.roles.cache.some(role => allowedRoles.includes(role.name))) {
      return message.reply('❌ Bu komutu kullanmak için yetkin yok.');
    }

    const embed = new EmbedBuilder()
      .setTitle('Zyra Uptime Canlı Destek')
      .setDescription(
        `Merhaba, Zyra canlı destek sistemine hoş geldiniz.\n\n` +
        `Destek talebi oluşturmak için aşağıdaki butonlardan size uygun seçeneği seçebilirsiniz. ` +
        `Destek talebi oluşturduğunuz zaman bir yetkilimiz en kısa sürede sizinle ilgilenecektir.`
      )
      .setColor('#9B30FF'); // Mor renk (HEX)

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('genel_destek')
        .setLabel('Genel Destek')
        .setStyle(ButtonStyle.Primary), // Mavi

      new ButtonBuilder()
        .setCustomId('uptime_destek')
        .setLabel('Uptime Destek')
        .setStyle(ButtonStyle.Success), // Yeşil

      new ButtonBuilder()
        .setCustomId('bug_hata')
        .setLabel('Bug & Hata')
        .setStyle(ButtonStyle.Danger), // Kırmızı

      new ButtonBuilder()
        .setCustomId('reklam_sponsorluk')
        .setLabel('Reklam/Sponsorluk')
        .setStyle(ButtonStyle.Secondary) // Mor ton yok, en yakını bu
    );

    await message.channel.send({ embeds: [embed], components: [row] });
  }
};
