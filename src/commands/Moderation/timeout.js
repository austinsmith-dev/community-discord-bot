const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, MessageFlags } = require('discord.js')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('timeout')
        .setDescription('Timeouts a user')
        .setDMPermission(false)
        .addSubcommand(subcommand => subcommand
            .setName('set')
            .setDescription('Set a timeout')
            .addUserOption(option => option
                .setName('user')
                .setDescription('The user to timeout')
                .setRequired(true))
            .addStringOption(option => option
                .setName('days')
                .setDescription('Timeout duration in days'))
            .addStringOption(option => option
                .setName('hours')
                .setDescription('Timeout duration in hours'))
            .addStringOption(option => option
                .setName('minutes')
                .setDescription('Timeout duration in minutes'))
            .addStringOption(option => option
                .setName('seconds')
                .setDescription('Timeout duration in seconds'))
            .addStringOption(option => option
                .setName('reason')
                .setDescription('The reason for the timeout')))
        .addSubcommand(subcommand => subcommand
            .setName('remove')
            .setDescription('Remove a timeout')
            .addUserOption(option => option
                .setName('user')
                .setDescription('The user to remove the timeout from')
                .setRequired(true)))
        .setDMPermission(false),
    async execute(interaction) {

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
            const embed1 = new EmbedBuilder()
                .setColor(process.env.SERVER_COLOR)
                .setTitle('Error')
                .setDescription('You do not have permission to use this command! Required permission: **Moderate Members**.')
                .setAuthor({ name: interaction.client.user.username, iconURL: interaction.client.user.displayAvatarURL() })
                .setTimestamp();

            return await interaction.reply({ embeds: [embed1], flags: [MessageFlags.Ephemeral] });
        }

        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'set') {

            const user = interaction.options.getUser('user');
            const days = interaction.options.getString('days');
            const hours = interaction.options.getString('hours');
            const minutes = interaction.options.getString('minutes');
            const seconds = interaction.options.getString('seconds');
            const reason = interaction.options.getString('reason') || 'Not specified';

            const timeMember = await interaction.guild.members.fetch(user.id);

            if (!days && !hours && !minutes && !seconds) {
                const embed2 = new EmbedBuilder()
                    .setColor(process.env.SERVER_COLOR)
                    .setTitle('Timeout')
                    .setDescription('You must provide at least one time option!')
                    .setTimestamp()
                    .setAuthor({ name: interaction.client.user.username, iconURL: interaction.client.user.displayAvatarURL() })
                return await interaction.reply({ embeds: [embed2], flags: [MessageFlags.Ephemeral] });
            }

            if (!timeMember) {
                const embed3 = new EmbedBuilder()
                    .setColor(process.env.SERVER_COLOR)
                    .setTitle('Timeout')
                    .setDescription('The mentioned user is no longer in the server.')
                    .setAuthor({ name: interaction.client.user.username, iconURL: interaction.client.user.displayAvatarURL() })
                    .setTimestamp();

                return await interaction.reply({ embeds: [embed3], flags: [MessageFlags.Ephemeral] });
            }

            if (interaction.member.id === timeMember.id) {
                const embed5 = new EmbedBuilder()
                    .setColor(process.env.SERVER_COLOR)
                    .setTitle('Timeout')
                    .setDescription('You cannot timeout yourself!')
                    .setAuthor({ name: interaction.client.user.username, iconURL: interaction.client.user.displayAvatarURL() })
                    .setTimestamp();

                return await interaction.reply({ embeds: [embed5], flags: [MessageFlags.Ephemeral] });
            }

            if (!timeMember.kickable) {
                const embed4 = new EmbedBuilder()
                    .setColor(process.env.SERVER_COLOR)
                    .setTitle('Timeout')
                    .setDescription('You cannot timeout this user because they have a higher/same role.')
                    .setAuthor({ name: interaction.client.user.username, iconURL: interaction.client.user.displayAvatarURL() })
                    .setTimestamp();

                return await interaction.reply({ embeds: [embed4], flags: [MessageFlags.Ephemeral] });
            }

            if (timeMember.permissions.has(PermissionsBitField.Flags.Administrator)) {
                const embed6 = new EmbedBuilder()
                    .setColor(process.env.SERVER_COLOR)
                    .setTitle('Timeout')
                    .setDescription('You cannot timeout staff members or users with administrator permission!')
                    .setAuthor({ name: interaction.client.user.username, iconURL: interaction.client.user.displayAvatarURL() })
                    .setTimestamp();

                return await interaction.reply({ embeds: [embed6], flags: [MessageFlags.Ephemeral] });
            }

            let duration2 = (parseInt(days) || 0) * 86400 + (parseInt(hours) || 0) * 3600 + (parseInt(minutes) || 0) * 60 + (parseInt(seconds) || 0);
            if (duration2 === 0) {
                const embed7 = new EmbedBuilder()
                    .setColor(process.env.SERVER_COLOR)
                    .setTitle('Timeout')
                    .setDescription('You cannot specify 0 duration!')
                    .setTimestamp()
                    .setAuthor({ name: interaction.client.user.username, iconURL: interaction.client.user.displayAvatarURL() })
                return await interaction.reply({ embeds: [embed7], flags: [MessageFlags.Ephemeral] });
            }

            let duration = (parseInt(days) || 0) * 86400 + (parseInt(hours) || 0) * 3600 + (parseInt(minutes) || 0) * 60 + (parseInt(seconds) || 0);
            if (duration > 604800) {
                const embed8 = new EmbedBuilder()
                .setColor(process.env.SERVER_COLOR)
                    .setTitle('Timeout')
                    .setDescription('You cannot specify more than 1 week duration!')
                    .setTimestamp()
                    .setAuthor({ name: interaction.client.user.username, iconURL: interaction.client.user.displayAvatarURL() })
                return await interaction.reply({ embeds: [embed8], flags: [MessageFlags.Ephemeral] });
            }

            let displayDays = Math.floor(duration / 86400);
            let displayHours = Math.floor((duration % 86400) / 3600);
            let displayMinutes = Math.floor((duration % 3600) / 60);
            let displaySeconds = duration % 60;

            let durationString = `${displayDays > 0 ? displayDays + ' day' : ''}${displayHours > 0 ? (displayDays > 0 ? ', ' : '') + displayHours + ' hour' : ''}${displayMinutes > 0 ? (displayDays > 0 || displayHours > 0 ? ', ' : '') + displayMinutes + ' minute' : ''}${displaySeconds > 0 ? (displayDays > 0 || displayHours > 0 || displayMinutes > 0 ? ', ' : '') + displaySeconds + ' second' : ''}`;

            await timeMember.timeout(duration * 1000, reason);

            const embed9 = new EmbedBuilder()
            .setColor(process.env.SERVER_COLOR)
                .setTitle('Timeout')
                .setDescription(`${user} has been successfully timed out.`)
                .addFields(
                    { name: 'Duration', value: durationString, inline: true},
                    { name: 'Reason', value: reason, inline: true }
                )
                .setTimestamp()
                .setAuthor({ name: interaction.client.user.username, iconURL: interaction.client.user.displayAvatarURL() })
            return await interaction.reply({ embeds: [embed9] });

        }

        if (subcommand === 'remove') {

            const user = interaction.options.getUser('user');

            const timeMember = await interaction.guild.members.fetch(user.id);

            if (!timeMember) {
                const embed10 = new EmbedBuilder()
                .setColor(process.env.SERVER_COLOR)
                    .setTitle('Timeout')
                    .setDescription('The mentioned user is no longer in the server.')
                    .setAuthor({ name: interaction.client.user.username, iconURL: interaction.client.user.displayAvatarURL() })
                    .setTimestamp();

                return await interaction.reply({ embeds: [embed10], flags: [MessageFlags.Ephemeral] });
            }

            await timeMember.timeout(null);

            const embed11 = new EmbedBuilder()
                .setColor(process.env.SERVER_COLOR)
                .setTitle('Timeout')
                .setDescription(`Timeout for ${user} has been removed.`)
                .setTimestamp()
                .setAuthor({ name: interaction.client.user.username, iconURL: interaction.client.user.displayAvatarURL() })
            return await interaction.reply({ embeds: [embed11] });
        }
    }
};