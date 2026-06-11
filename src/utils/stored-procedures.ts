import prisma from '../config/database';


/**
 * Utility class to execute stored procedures
 * Provides type-safe wrappers around raw SQL execution
 */
export class StoredProcedureExecutor {
  /**
   * Execute a stored procedure that returns multiple result sets
   */
  static async executeMultiple<T = any>(
    procedureName: string,
    params: Record<string, any> = {}
  ): Promise<T> {
    const paramList = Object.entries(params)
      .map(([key, value]) => {
        if (value === null || value === undefined) {
          return `@${key} = NULL`;
        }
        if (typeof value === 'string') {
          return `@${key} = '${value.replace(/'/g, "''")}'`;
        }
        if (value instanceof Date) {
          return `@${key} = '${value.toISOString()}'`;
        }
        return `@${key} = ${value}`;
      })
      .join(', ');

    const query = paramList
      ? `EXEC ${procedureName} ${paramList}`
      : `EXEC ${procedureName}`;

    const result = await prisma.$queryRawUnsafe<T>(query);
    return result;
  }

  /**
   * Execute a stored procedure that returns a single result set
   */
  static async executeSingle<T = any>(
    procedureName: string,
    params: Record<string, any> = {}
  ): Promise<T[]> {
    return this.executeMultiple<T[]>(procedureName, params);
  }

  /**
   * Execute a stored procedure with pagination support
   */
  static async executePaginated<T = any>(
    procedureName: string,
    params: Record<string, any> & { PageNumber?: number }
  ): Promise<{
    data: T[];
    totalRows: number;
    currentPage: number;
  }> {
    const pageNumber = params.PageNumber || 1;
    const result = await this.executeSingle<T & { TotalRows?: number }>(
      procedureName,
      params
    );

    const totalRows = result.length > 0 ? (result[0].TotalRows || 0) : 0;

    return {
      data: result,
      totalRows,
      currentPage: pageNumber,
    };
  }
}
