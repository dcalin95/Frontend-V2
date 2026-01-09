/**
 * 🔧 Database Adapter - pg Pool to Sequelize-like Interface
 * 
 * Adapter pentru a permite serviciilor AI Trading să folosească `pg` Pool
 * cu o interfață similară cu Sequelize models, pentru compatibilitate.
 * 
 * @module dbAdapter
 */

/**
 * Create database adapter pentru AI Trading services
 * @param {Object} db - Database object cu query și pool
 * @returns {Object} Adapter object cu models-like interface
 */
function createDbAdapter(db) {
  return {
    // Signals Model
    Signal: {
      async create(data) {
        const result = await db.query(`
          INSERT INTO signals (
            user_id, token, signal, confidence, reasoning,
            entry_price, stop_loss, take_profit, priority, valid, validation_errors
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          RETURNING *
        `, [
          data.userId || data.user_id,
          data.token,
          data.signal,
          data.confidence,
          data.reasoning || null,
          data.entryPrice || data.entry_price || null,
          data.stopLoss || data.stop_loss || null,
          data.takeProfit || data.take_profit || null,
          data.priority || 50,
          data.valid !== undefined ? data.valid : true,
          data.validationErrors || data.validation_errors || null
        ]);
        return mapRowToCamelCase(result.rows[0]);
      },

      async findAll(options = {}) {
        const { where = {}, limit, offset, order = [['created_at', 'DESC']] } = options;
        let query = 'SELECT * FROM signals WHERE 1=1';
        const params = [];
        let paramCount = 1;

        if (where.userId || where.user_id) {
          query += ` AND user_id = $${paramCount++}`;
          params.push(where.userId || where.user_id);
        }
        if (where.token) {
          query += ` AND token = $${paramCount++}`;
          params.push(where.token);
        }
        if (where.signal) {
          query += ` AND signal = $${paramCount++}`;
          params.push(where.signal);
        }
        if (where.valid !== undefined) {
          query += ` AND valid = $${paramCount++}`;
          params.push(where.valid);
        }

        // Order by
        if (order && order.length > 0) {
          const [field, direction] = order[0];
          const dbField = camelToSnakeCase(field);
          query += ` ORDER BY ${dbField} ${direction || 'DESC'}`;
        }

        // Limit & Offset
        if (limit) {
          query += ` LIMIT $${paramCount++}`;
          params.push(limit);
        }
        if (offset) {
          query += ` OFFSET $${paramCount++}`;
          params.push(offset);
        }

        const result = await db.query(query, params);
        return result.rows.map(mapRowToCamelCase);
      },

      async findOne(options = {}) {
        const { where = {} } = options;
        let query = 'SELECT * FROM signals WHERE 1=1';
        const params = [];
        let paramCount = 1;

        if (where.id) {
          query += ` AND id = $${paramCount++}`;
          params.push(where.id);
        }
        if (where.userId || where.user_id) {
          query += ` AND user_id = $${paramCount++}`;
          params.push(where.userId || where.user_id);
        }

        query += ' LIMIT 1';
        const result = await db.query(query, params);
        return result.rows.length > 0 ? mapRowToCamelCase(result.rows[0]) : null;
      },

      async count(options = {}) {
        const { where = {} } = options;
        let query = 'SELECT COUNT(*) as count FROM signals WHERE 1=1';
        const params = [];
        let paramCount = 1;

        if (where.userId || where.user_id) {
          query += ` AND user_id = $${paramCount++}`;
          params.push(where.userId || where.user_id);
        }

        const result = await db.query(query, params);
        return parseInt(result.rows[0].count);
      }
    },

    // Trades Model
    Trade: {
      async create(data) {
        const result = await db.query(`
          INSERT INTO trades (
            user_id, signal_id, token_in, token_out, amount_in, amount_out,
            entry_price, exit_price, stop_loss, take_profit, tx_hash, status, pnl,
            executed_at, closed_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
          RETURNING *
        `, [
          data.userId || data.user_id,
          data.signalId || data.signal_id || null,
          data.tokenIn || data.token_in,
          data.tokenOut || data.token_out,
          data.amountIn || data.amount_in,
          data.amountOut || data.amount_out || null,
          data.entryPrice || data.entry_price,
          data.exitPrice || data.exit_price || null,
          data.stopLoss || data.stop_loss || null,
          data.takeProfit || data.take_profit || null,
          data.txHash || data.tx_hash || null,
          data.status || 'pending',
          data.pnl || null,
          data.executedAt || data.executed_at || null,
          data.closedAt || data.closed_at || null
        ]);
        return mapRowToCamelCase(result.rows[0]);
      },

      async findAll(options = {}) {
        const { where = {}, limit, offset, order = [['created_at', 'DESC']] } = options;
        let query = 'SELECT * FROM trades WHERE 1=1';
        const params = [];
        let paramCount = 1;

        if (where.userId || where.user_id) {
          query += ` AND user_id = $${paramCount++}`;
          params.push(where.userId || where.user_id);
        }
        if (where.status) {
          query += ` AND status = $${paramCount++}`;
          params.push(where.status);
        }
        if (where.tokenIn || where.token_in) {
          query += ` AND token_in = $${paramCount++}`;
          params.push(where.tokenIn || where.token_in);
        }
        if (where.tokenOut || where.token_out) {
          query += ` AND token_out = $${paramCount++}`;
          params.push(where.tokenOut || where.token_out);
        }
        if (where.createdAt) {
          if (where.createdAt[Symbol.for('between')]) {
            const [start, end] = where.createdAt[Symbol.for('between')];
            query += ` AND created_at BETWEEN $${paramCount++} AND $${paramCount++}`;
            params.push(start, end);
          }
        }

        // Order by
        if (order && order.length > 0) {
          const [field, direction] = order[0];
          const dbField = camelToSnakeCase(field);
          query += ` ORDER BY ${dbField} ${direction || 'DESC'}`;
        }

        // Limit & Offset
        if (limit) {
          query += ` LIMIT $${paramCount++}`;
          params.push(limit);
        }
        if (offset) {
          query += ` OFFSET $${paramCount++}`;
          params.push(offset);
        }

        const result = await db.query(query, params);
        return result.rows.map(mapRowToCamelCase);
      },

      async findAndCountAll(options = {}) {
        const rows = await this.findAll(options);
        const count = await this.count({ where: options.where || {} });
        return { rows, count };
      },

      async findOne(options = {}) {
        const { where = {} } = options;
        let query = 'SELECT * FROM trades WHERE 1=1';
        const params = [];
        let paramCount = 1;

        if (where.id) {
          query += ` AND id = $${paramCount++}`;
          params.push(where.id);
        }
        if (where.userId || where.user_id) {
          query += ` AND user_id = $${paramCount++}`;
          params.push(where.userId || where.user_id);
        }

        query += ' LIMIT 1';
        const result = await db.query(query, params);
        return result.rows.length > 0 ? mapRowToCamelCase(result.rows[0]) : null;
      },

      async count(options = {}) {
        const { where = {} } = options;
        let query = 'SELECT COUNT(*) as count FROM trades WHERE 1=1';
        const params = [];
        let paramCount = 1;

        if (where.userId || where.user_id) {
          query += ` AND user_id = $${paramCount++}`;
          params.push(where.userId || where.user_id);
        }
        if (where.status) {
          query += ` AND status = $${paramCount++}`;
          params.push(where.status);
        }

        const result = await db.query(query, params);
        return parseInt(result.rows[0].count);
      }
    },

    // Strategies Model
    Strategy: {
      async create(data) {
        const result = await db.query(`
          INSERT INTO strategies (
            user_id, name, type, config, enabled, risk_level
          )
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *
        `, [
          data.userId || data.user_id,
          data.name,
          data.type,
          JSON.stringify(data.config || {}),
          data.enabled !== undefined ? data.enabled : true,
          data.riskLevel || data.risk_level || 'balanced'
        ]);
        return mapRowToCamelCase(result.rows[0]);
      },

      async findAll(options = {}) {
        const { where = {}, order = [['created_at', 'DESC']] } = options;
        let query = 'SELECT * FROM strategies WHERE 1=1';
        const params = [];
        let paramCount = 1;

        if (where.userId || where.user_id) {
          query += ` AND user_id = $${paramCount++}`;
          params.push(where.userId || where.user_id);
        }

        // Order by
        if (order && order.length > 0) {
          const [field, direction] = order[0];
          const dbField = camelToSnakeCase(field);
          query += ` ORDER BY ${dbField} ${direction || 'DESC'}`;
        }

        const result = await db.query(query, params);
        return result.rows.map(mapRowToCamelCase);
      },

      async findOne(options = {}) {
        const { where = {} } = options;
        let query = 'SELECT * FROM strategies WHERE 1=1';
        const params = [];
        let paramCount = 1;

        if (where.id) {
          query += ` AND id = $${paramCount++}`;
          params.push(where.id);
        }
        if (where.userId || where.user_id) {
          query += ` AND user_id = $${paramCount++}`;
          params.push(where.userId || where.user_id);
        }

        query += ' LIMIT 1';
        const result = await db.query(query, params);
        return result.rows.length > 0 ? mapRowToCamelCase(result.rows[0]) : null;
      },

      async update(data, options = {}) {
        const { where = {} } = options;
        let query = 'UPDATE strategies SET updated_at = NOW()';
        const setParams = [];
        const whereParams = [];
        let paramCount = 1;

        if (data.name !== undefined) {
          query += `, name = $${paramCount++}`;
          setParams.push(data.name);
        }
        if (data.type !== undefined) {
          query += `, type = $${paramCount++}`;
          setParams.push(data.type);
        }
        if (data.config !== undefined) {
          query += `, config = $${paramCount++}`;
          setParams.push(JSON.stringify(data.config));
        }
        if (data.enabled !== undefined) {
          query += `, enabled = $${paramCount++}`;
          setParams.push(data.enabled);
        }
        if (data.riskLevel !== undefined || data.risk_level !== undefined) {
          query += `, risk_level = $${paramCount++}`;
          setParams.push(data.riskLevel || data.risk_level);
        }

        query += ' WHERE 1=1';
        if (where.id) {
          query += ` AND id = $${paramCount++}`;
          whereParams.push(where.id);
        }
        if (where.userId || where.user_id) {
          query += ` AND user_id = $${paramCount++}`;
          whereParams.push(where.userId || where.user_id);
        }

        query += ' RETURNING *';
        const params = [...setParams, ...whereParams];
        const result = await db.query(query, params);
        return result.rows.length > 0 ? mapRowToCamelCase(result.rows[0]) : null;
      },

      async destroy(options = {}) {
        const { where = {} } = options;
        let query = 'DELETE FROM strategies WHERE 1=1';
        const params = [];
        let paramCount = 1;

        if (where.id) {
          query += ` AND id = $${paramCount++}`;
          params.push(where.id);
        }
        if (where.userId || where.user_id) {
          query += ` AND user_id = $${paramCount++}`;
          params.push(where.userId || where.user_id);
        }

        const result = await db.query(query, params);
        return result.rowCount;
      }
    },

    // Bots Model
    Bot: {
      async create(data) {
        const result = await db.query(`
          INSERT INTO bots (
            user_id, bot_id, config, status, started_at
          )
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *
        `, [
          data.userId || data.user_id,
          data.botId || data.bot_id,
          JSON.stringify(data.config || {}),
          data.status || 'running',
          data.startedAt || data.started_at || new Date()
        ]);
        return mapRowToCamelCase(result.rows[0]);
      },

      async findOne(options = {}) {
        const { where = {}, order = [['started_at', 'DESC']] } = options;
        let query = 'SELECT * FROM bots WHERE 1=1';
        const params = [];
        let paramCount = 1;

        if (where.userId || where.user_id) {
          query += ` AND user_id = $${paramCount++}`;
          params.push(where.userId || where.user_id);
        }
        if (where.status) {
          query += ` AND status = $${paramCount++}`;
          params.push(where.status);
        }
        if (where.botId || where.bot_id) {
          query += ` AND bot_id = $${paramCount++}`;
          params.push(where.botId || where.bot_id);
        }

        // Order by
        if (order && order.length > 0) {
          const [field, direction] = order[0];
          const dbField = camelToSnakeCase(field);
          query += ` ORDER BY ${dbField} ${direction || 'DESC'}`;
        }

        query += ' LIMIT 1';
        const result = await db.query(query, params);
        return result.rows.length > 0 ? mapRowToCamelCase(result.rows[0]) : null;
      },

      async update(data, options = {}) {
        const { where = {} } = options;
        let query = 'UPDATE bots SET updated_at = NOW()';
        const setParams = [];
        const whereParams = [];
        let paramCount = 1;

        if (data.status !== undefined) {
          query += `, status = $${paramCount++}`;
          setParams.push(data.status);
        }
        if (data.config !== undefined) {
          query += `, config = $${paramCount++}`;
          setParams.push(JSON.stringify(data.config));
        }
        if (data.stoppedAt !== undefined || data.stopped_at !== undefined) {
          query += `, stopped_at = $${paramCount++}`;
          setParams.push(data.stoppedAt || data.stopped_at);
        }

        query += ' WHERE 1=1';
        if (where.userId || where.user_id) {
          query += ` AND user_id = $${paramCount++}`;
          whereParams.push(where.userId || where.user_id);
        }
        if (where.status) {
          query += ` AND status = $${paramCount++}`;
          whereParams.push(where.status);
        }

        query += ' RETURNING *';
        const params = [...setParams, ...whereParams];
        const result = await db.query(query, params);
        return result.rows.map(mapRowToCamelCase);
      }
    }
  };
}

/**
 * Map database row (snake_case) to camelCase object
 */
function mapRowToCamelCase(row) {
  if (!row) return null;
  const mapped = {};
  for (const key in row) {
    const camelKey = snakeToCamelCase(key);
    mapped[camelKey] = row[key];
  }
  return mapped;
}

/**
 * Convert snake_case to camelCase
 */
function snakeToCamelCase(str) {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Convert camelCase to snake_case
 */
function camelToSnakeCase(str) {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

module.exports = { createDbAdapter, mapRowToCamelCase, snakeToCamelCase, camelToSnakeCase };

