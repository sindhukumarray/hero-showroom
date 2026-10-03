const leadService = require('../services/leadService');
const { sendSuccess, sendError } = require('../utils/apiResponse');

/**
 * Admin Lead Controller
 * Handles administrative Lead management, search, filtering, and status progression workflow.
 */

/**
 * List leads with pagination, search, and administrative filters
 * GET /api/admin/leads
 */
const getLeads = async (req, res, next) => {
  try {
    const {
      page,
      limit,
      status,
      source,
      showroom,
      bike,
      user,
      search,
      sort,
      startDate,
      endDate
    } = req.query;

    const result = await leadService.getAdminLeads({
      page,
      limit,
      status,
      source,
      showroom,
      bike,
      user,
      search,
      sort,
      startDate,
      endDate
    });

    return sendSuccess(res, 'Admin leads retrieved successfully', result.data, 200, result.meta);
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve single lead by ID with populated customer, vehicle, and dealership relationships
 * GET /api/admin/leads/:id
 */
const getLeadById = async (req, res, next) => {
  try {
    const lead = await leadService.getLeadById(req.params.id);
    if (!lead) {
      return sendError(res, 'Lead not found', [`No lead enquiry found with ID '${req.params.id}'`], 404);
    }
    return sendSuccess(res, 'Lead retrieved successfully', lead, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Update lead lifecycle status
 * PATCH /api/admin/leads/:id/status
 */
const updateLeadStatus = async (req, res, next) => {
  try {
    const lead = await leadService.updateLeadStatus(req.params.id, req.body.status);
    return sendSuccess(
      res,
      `Lead status updated to '${lead.status}' successfully`,
      lead,
      200
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLeads,
  getLeadById,
  updateLeadStatus
};
