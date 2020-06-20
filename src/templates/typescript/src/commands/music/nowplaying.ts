import { client } from '../../index';
import { Command } from '../../lib/commands/Command';
import { CommandExecutor } from '../../lib/commands/CommandExecutor';
import { MusicPlayer } from '../../lib/music/MusicPlayer';
import { Queue } from '../../lib/music/Queue';
import { Message, MessageEmbed } from 'discord.js';

@Command({
    name: 'nowplaying',
    aliases: ['np', 'now_playing', 'current', 'currentlyplaying', 'currently_playing'],
    description: 'View the currently playing song with a fancy duration bar',
    category: 'Music'
})
default class implements CommandExecutor {

    execute = async (message: Message): Promise<boolean> => {

        const { queue, player } = message.guild!;

        if (typeof queue.current === 'undefined') return false;

        const embed = new MessageEmbed()
            .setColor('RANDOM')
            .setTitle('Now Playing:')
            .setThumbnail(queue.current.thumbnail)
            .setFooter(`Requested by ${message.author.tag}`)
            .setTimestamp();

        this.setEmbed(embed, queue, player);
        const msg = await message.channel.send(embed);

        const interval = setInterval(() => {
            this.setEmbed(embed, queue, player);
            msg.edit(embed);
        }, 5000);

        queue.connection?.dispatcher.on('finish', () => {
            clearInterval(interval);
            const [durationBar] = player.durationBar(queue);

            embed.setTitle('Was Playing:');
            embed.setDescription(`\`\`\`${durationBar.substr(1) + durationBar.substr(0, 1)} Ended\`\`\``);
            embed.spliceFields(1, 1, { name: 'Remaining Time:', value: 'Ended', inline: true });

            msg.edit(embed);
        });

        return true;

    }

    private setEmbed = async (embed: MessageEmbed, queue: Queue, player: MusicPlayer) => {

        const { current, upcoming, connection } = queue;
        const { title, url, duration, loop, requester, author, authorUrl } = current!;

        const [durationBar, timeString] = player.durationBar(queue);
        const timeRemaining = client.$utils.formatSeconds(duration - (connection!.dispatcher.streamTime / 1000));
        const upcomingVid = upcoming[0] ? `[${client.$utils.truncateStr(upcoming[0].title, 20)}](${upcoming[0].url})` : 'None';

        embed.setDescription(`[${title}](${url})\n\`\`\`${durationBar} ${timeString}\`\`\``);
        embed.spliceFields(0, 6,
            { name: 'Duration:', value: client.$utils.formatSeconds(duration), inline: true },
            { name: 'Remaining Time:', value: timeRemaining, inline: true },
            { name: 'Looping:', value: String(loop)[0].toUpperCase() + String(loop).substring(1), inline: true },
            { name: 'Requested By:', value: requester.user.tag, inline: true },
            { name: 'Uploaded By:', value: `[${author}](${authorUrl})`, inline: true },
            { name: 'Up Next:', value: upcomingVid, inline: true }
        );

    }

}