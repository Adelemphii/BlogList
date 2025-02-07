const blogsRouter = require('express').Router()

const middleware = require('../utils/middleware')

const Blog = require('../models/blog')

blogsRouter.get('/', async (request, response) => {
  const blogs = await Blog.find({}).populate('user', { username: 1, name: 1 })
  response.json(blogs)
})

blogsRouter.get('/:id', async (request, response) => {
  const blog = await Blog.findById(request.params.id)
  if(blog) {
    response.json(blog)
  } else {
    response.status(404).end()
  }
})

blogsRouter.post('/', middleware.tokenExtractor, middleware.userExtractor, async (request, response) => {
  const body = request.body

  const token = request.token
  if(!token) {
    return response.status(401).json({ error: 'invalid token' })
  }
  const user = request.user
  if(!user) {
    return response.status(401).json({ error: 'invalid token' })
  }

  const blog = new Blog({
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes,
    user: user.id
  })

  const result = await blog.save()
  user.blogs = user.blogs.concat(result._id)
  await user.save()

  response.status(201).json(result)
})

blogsRouter.delete('/:id', middleware.tokenExtractor, middleware.userExtractor, async (request, response) => {
  const token = request.token
  if(!token) {
    return response.status(401).json({ error: 'invalid token' })
  }
  const user = request.user
  if(!user) {
    return response.status(401).json({ error: 'invalid token' })
  }

  const blog = await Blog.findById(request.params.id)
  if(blog.user.toString() === user.id.toString()) {
    await Blog.deleteOne(blog)
    response.status(204).end()
  } else {
    response.status(401).json({ error: 'Only the creator of this blog can delete it' })
  }
})

blogsRouter.put('/:id', middleware.tokenExtractor, middleware.userExtractor, async (request, response) => {
  const { title, author, url, likes } = request.body

  const updatedBlog = await Blog.findByIdAndUpdate(
    request.params.id,
    { title, author, url, likes },
    { new: true, runValidators: true, context: 'query' }
  )
  response.json(updatedBlog)
})

module.exports = blogsRouter