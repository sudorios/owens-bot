async function detectRepliedBotMessageId({ interaction }) {
  try {
    const ref = interaction.message?.reference;
    if (ref?.messageId) {
      const repliedMsg = await interaction.channel.messages.fetch(ref.messageId).catch(() => null);
      if (repliedMsg && repliedMsg.author?.id === interaction.client.user?.id) {
        return repliedMsg.id;
      }
    }

    const optMsg = interaction.options?.getMessage?.('message');
    if (optMsg && optMsg.author?.id === interaction.client.user?.id) {
      return optMsg.id;
    }

    return null;
  } catch {
    return null;
  }
}

module.exports = { detectRepliedBotMessageId };
