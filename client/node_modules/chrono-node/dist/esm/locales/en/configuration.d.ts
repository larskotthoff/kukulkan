import { Configuration } from "../../chrono.js";
export default class ENDefaultConfiguration {
    createCasualConfiguration(littleEndian?: boolean): Configuration;
    createConfiguration(strictMode?: boolean, littleEndian?: boolean): Configuration;
}
