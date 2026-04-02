const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const sysinfo = require('systeminformation');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sysinfo')
        .setDescription('Get the bot\'s system and latency information.')
        .setDMPermission(false),
    async execute(interaction) {

        const startTimestamp = Date.now();
        await interaction.deferReply();

        const [cpuData, cpuCurrentSpeed, memoryData] = await Promise.all([
            sysinfo.cpu(),
            sysinfo.cpuCurrentSpeed(),
            sysinfo.mem()
        ]).catch(err => {
            console.error("Error fetching system information:", err);
            return interaction.editReply({ content: '❌ Error fetching system hardware details.' });
        });

        const { manufacturer, brand } = cpuData;
        const { avg } = cpuCurrentSpeed;
        const { total, used } = memoryData;
        
        const heartbeatLatency = interaction.client.ws.ping;
        const responseLatency = Date.now() - startTimestamp;

        const usedMemoryGB = (used / (1024 ** 3)).toFixed(2);
        const totalMemoryGB = (total / (1024 ** 3)).toFixed(2);
        const color = process.env.SERVER_COLOR || 'Blue';


        const sysinfoEmbed = new EmbedBuilder()
            .setTitle('🤖 Bot System & Performance Info')
            .setThumbnail(interaction.client.user.displayAvatarURL({ size: 64 }))
            .setColor(color)
            .setTimestamp()
            .setFooter({ text: `Retrieved information` })
            .addFields(
                {
                    name: '🌐 Discord Latency (Ping)',
                    value: `**Heartbeat:** \`${heartbeatLatency}ms\`\n**Response:** \`${responseLatency}ms\``,
                    inline: false,
                },
                {
                    name: '💻 CPU Details',
                    value: `**Name:** ${manufacturer} ${brand}\n**Speed:** ${avg} GHz`,
                    inline: true,
                },
                {
                    name: '💾 Memory Usage',
                    value: `**Used/Total:** ${usedMemoryGB} GB / ${totalMemoryGB} GB`,
                    inline: true,
                }
            );

        await interaction.editReply({ embeds: [sysinfoEmbed], content: '\u200b' });
    },
};
