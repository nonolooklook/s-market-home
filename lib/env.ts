import { ENVS } from "./config"

export const isDEV = ENVS.ENV == 'dev'
export const isPROD = ENVS.ENV == 'prod'

