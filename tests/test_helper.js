const Blog = require('../models/blog')
const User = require('../models/user')

const initialBlogs = [
  {
    title: 'HTML is easy',
    author: 'String',
    url: 'String',
    likes: 1
  },
  {
    title: 'Browser can only execute JavaScript',
    author: 'String 2',
    url: 'String2',
    likes: 12
  }
]

const nonExistingId = async () => {
  const blog = new Blog({ title: 'willremovethissoon' })
  await blog.save()
  await blog.deleteOne()

  return blog._id.toString()
}

const blogsInDb = async () => {
  const blogs = await Blog.find({})
  return blogs.map(blog => blog.toJSON())
}

const usersInDb = async () => {
  const users = await User.find({})
  return users.map(user => user.toJSON())
}

module.exports = {
  initialBlogs,
  nonExistingId,
  blogsInDb, usersInDb
}