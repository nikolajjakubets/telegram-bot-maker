const Telegram = require('./telegram-api')

class Context extends Telegram {
  constructor(props) {
    const { update, onReply } = props
    super(props)
    this.updates = [update]
    this._onReply = onReply
    this.lastMessage = null
    this.replyListeners = []
    this._addUpdate = this.addUpdate.bind(this)
  }

  getType() {
    const { callback_query, message } = this.getLast()
    if (callback_query) {
      return 'callback_query'
    }

    if (message) {
      return 'message'
    }

    return null
  }

  addUpdate(update) {
    this.updates.push(update)
  }

  getLast() {
    return this.updates[this.updates.length - 1]
  }

  getInsideObj() {
    return this.getLast()[this.getType()]
  }

  getFromId() {
    return this.getInsideObj().from.id
  }

  getChatId() {
    const { chat, message } = this.getInsideObj()

    if (chat) {
      return chat.id
    }

    if (message.chat.id) {
      return message.chat.id
    }
  }

  ref() {
    //new error if not message_id

    const message_id = this.lastMessage.message_id

    return {
      message_id,
      chat_id: this.getChatId(),
      from_id: this.getFromId(),
    }
  }

  contextParams(params) {
    return {
      chat_id: this.getChatId(),
      ...params,
    }
  }

  reply(text, params) {
    this.sendMessage(this.contextParams({ text, ...params }))
      .then(this.afterBotReply)
      .catch(console.warn)
    return this
  }

  afterBotReply(lastMessage) {
    this.lastMessage = lastMessage
    this.triggerBotReply()
  }

  triggerBotReply() {
    if (this.replyListeners.length) {
      this._onReply(this.ref(), this.replyListeners[0], this._addUpdate)
      this.clearFirstReplyListener()
    }
  }

  clearFirstReplyListener() {
    if (this.replyListeners.length > 1) {
      this.replyListeners = this.replyListeners.filter((l, i) => i > 0)
    } else {
      this.replyListeners = []
    }
  }

  waitForReply(listener) {
    this.replyListeners.push(listener)
    return this
  }
}

module.exports = Context
