import { Configuration } from "../../chrono";
export default class ENDefaultConfiguration {
    createCasualConfiguration(littleEndian?: boolean): Configuration;
    createConfiguration(strictMode?: boolean, littleEndian?: boolean): Configuration;
}
