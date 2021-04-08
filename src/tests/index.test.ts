import request from 'supertest';
import server from '../index';


// Main Page
describe('Main Page', () => {
  it('Index', async () => {
    const res = await request(server).get('/');

    expect(res.statusCode).toEqual(200)
  }),
  it('Dansesben api description', async () => {
    const res = await request(server).get('/info/performances-by-degrees-us');

    expect(res.statusCode).toEqual(200)
  })
})


// Dansesben API
describe('Main Page', () => {
  it('LoadInitialData', async () => {
    const res = await request(server).get('/api/v1/performances-by-degrees-us/loadInitialData');

    expect(res.statusCode).toEqual(201)
  }),
  it('Stats GET', async () => {
    const res = await request(server).get('/api/v1/performances-by-degrees-us/stats');

    expect(res.statusCode).toEqual(200)
  }),
  it('Stats PUT', async () => {
    const res = await request(server).put('/api/v1/performances-by-degrees-us/stats');

    expect(res.statusCode).toEqual(405)
  }),
  it('Stats DELETE', async () => {
    const res = await request(server).delete('/api/v1/performances-by-degrees-us/stats');

    expect(res.statusCode).toEqual(200)
  }),
  it('Stats DELETE', async () => {
    const res = await request(server).delete('/api/v1/performances-by-degrees-us/stats/FHISTORY/History/2018');

    expect(res.statusCode).toEqual(200)
  })
})


// Close the server after testing
afterAll(done => {
  server.close()
  done()
})